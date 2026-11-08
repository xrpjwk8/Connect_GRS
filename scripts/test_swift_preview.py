#!/usr/bin/env python3
"""Compile actual Swift API sources and verify preview never reaches the network."""
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
HARNESS = r'''
import Foundation

@main
struct PreviewChecks {
    static func main() async throws {
        #if DEBUG
        if ProcessInfo.processInfo.environment["CONNECT_USE_LEGACY_SERVER"] == "1" {
            precondition(!APIConfig.isOfflinePreview)
            print("PASS explicit legacy-server opt-in disables preview")
            return
        }
        precondition(APIConfig.isOfflinePreview)
        let id = UUID()
        let filters = try await ConnectAPI.fetchFilters()
        precondition(!filters.regions.isEmpty)
        let stores = try await ConnectAPI.searchStores(bookerId: id, region: nil, category: nil, people: nil, date: nil, time: nil)
        precondition(!stores.isEmpty)
        let featured = try await ConnectAPI.featuredStores(bookerId: id, region: nil)
        precondition(!featured.isEmpty)
        let detail = try await ConnectAPI.store(storeId: stores[0].id, bookerId: id)
        precondition(detail.name == stores[0].name)
        let favorites = try await ConnectAPI.favorites(bookerId: id)
        let reservations = try await ConnectAPI.reservations(bookerId: id, statusGroup: nil)
        precondition(favorites.isEmpty && reservations.isEmpty)
        let dashboard = try await ConnectAPI.ownerDashboard(ownerId: id)
        precondition(dashboard.pendingRequests.isEmpty)
        let availability = try await ConnectAPI.availability(ownerId: id, storeId: id, date: "2026-10-13")
        precondition(availability.slots.count == 15)
        print("PASS all eight screen data reads work without a server")
        do {
            try await ConnectAPI.addFavorite(bookerId: id, storeId: id)
            fatalError("Preview write unexpectedly succeeded")
        } catch APIError.previewOnly {}
        do {
            let _: FilterMetadataDTO = try await APIClient.shared.get("/unhandled")
            fatalError("Unhandled endpoint bypassed preview isolation")
        } catch APIError.previewOnly {}
        do {
            _ = try await ConnectAPI.signUpBooker(BookerSignUpRequestBody(schoolName: "", departmentName: "", position: "", realName: "", schoolEmail: "", phoneNumber: ""))
            fatalError("Preview created a server account")
        } catch APIError.previewOnly {}
        print("PASS writes, unhandled reads and server signup are blocked before transport")
        #else
        precondition(!APIConfig.isOfflinePreview)
        print("PASS Release excludes offline preview even when environment requests it")
        #endif
    }
}
'''
with tempfile.TemporaryDirectory(prefix="connect-swift-preview-") as directory:
    temp = Path(directory)
    harness = temp / "PreviewChecks.swift"
    harness.write_text(HARNESS)
    sources = [ROOT / path for path in ["Connect/Networking/APIClient.swift", "Connect/Networking/APIModels.swift", "Connect/Models/MockData.swift"]]
    env = os.environ.copy()
    env.pop("CONNECT_USE_LEGACY_SERVER", None)
    for debug in [True, False]:
        binary = temp / ("debug" if debug else "release")
        command = ["xcrun", "swiftc", "-module-cache-path", str(temp / "module-cache")]
        if debug:
            command += ["-D", "DEBUG"]
        subprocess.run(command + [str(p) for p in sources] + [str(harness), "-o", str(binary)], check=True)
        subprocess.run([str(binary)], env=env, check=True)
        if debug:
            subprocess.run([str(binary)], env={**env, "CONNECT_USE_LEGACY_SERVER": "1"}, check=True)
        else:
            subprocess.run([str(binary)], env={**env, "CONNECT_USE_LEGACY_SERVER": "0"}, check=True)
