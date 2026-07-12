import Foundation

enum APIConfig {
    /// 시뮬레이터에서는 localhost가 macOS 호스트를 가리켜서 그대로 사용 가능.
    /// 실기기 테스트 시엔 macOS의 LAN IP로 바꿔야 함.
    static var baseURL = URL(string: "http://localhost:8080")!
}

enum APIError: LocalizedError {
    case invalidURL
    case server(status: Int, message: String)
    case decoding(Error)
    case network(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "잘못된 요청 주소입니다."
        case .server(let status, let message):
            return "서버 오류 (\(status)): \(message)"
        case .decoding:
            return "서버 응답을 읽을 수 없습니다."
        case .network(let error):
            return "네트워크 오류: \(error.localizedDescription)"
        }
    }
}

private struct APIErrorBody: Decodable {
    let message: String?
}

/// Connect GRS 백엔드(Spring Boot, http://localhost:8080)와 통신하는 최소 REST 클라이언트.
actor APIClient {
    static let shared = APIClient()

    private let session: URLSession = .shared
    private let decoder: JSONDecoder = JSONDecoder()
    private let encoder: JSONEncoder = JSONEncoder()

    func get<Response: Decodable>(_ path: String, query: [String: String?] = [:]) async throws -> Response {
        let request = try buildRequest(path: path, method: "GET", query: query, bodyData: nil)
        return try await send(request)
    }

    func post<Body: Encodable, Response: Decodable>(_ path: String, body: Body) async throws -> Response {
        let data = try encoder.encode(body)
        let request = try buildRequest(path: path, method: "POST", query: [:], bodyData: data)
        return try await send(request)
    }

    /// 204 No Content 등 응답 본문이 없는 POST용 (바디 없음).
    func postNoContent(_ path: String) async throws {
        let request = try buildRequest(path: path, method: "POST", query: [:], bodyData: nil)
        _ = try await sendRaw(request)
    }

    /// 204 No Content가 예상되는 POST(바디 있음)용.
    func postNoContent<Body: Encodable>(_ path: String, body: Body) async throws {
        let data = try encoder.encode(body)
        let request = try buildRequest(path: path, method: "POST", query: [:], bodyData: data)
        _ = try await sendRaw(request)
    }

    func patch<Body: Encodable, Response: Decodable>(_ path: String, body: Body) async throws -> Response {
        let data = try encoder.encode(body)
        let request = try buildRequest(path: path, method: "PATCH", query: [:], bodyData: data)
        return try await send(request)
    }

    func put<Body: Encodable, Response: Decodable>(_ path: String, body: Body) async throws -> Response {
        let data = try encoder.encode(body)
        let request = try buildRequest(path: path, method: "PUT", query: [:], bodyData: data)
        return try await send(request)
    }

    func delete(_ path: String) async throws {
        let request = try buildRequest(path: path, method: "DELETE", query: [:], bodyData: nil)
        _ = try await sendRaw(request)
    }

    // MARK: - Internals

    private func buildRequest(path: String, method: String, query: [String: String?], bodyData: Data?) throws -> URLRequest {
        guard var components = URLComponents(
            url: APIConfig.baseURL.appendingPathComponent(path),
            resolvingAgainstBaseURL: false
        ) else {
            throw APIError.invalidURL
        }
        let items = query.compactMapValues { $0 }.map { URLQueryItem(name: $0.key, value: $0.value) }
        if !items.isEmpty {
            components.queryItems = items
        }
        guard let url = components.url else { throw APIError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = method
        if let bodyData {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = bodyData
        }
        return request
    }

    private func sendRaw(_ request: URLRequest) async throws -> Data {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.network(error)
        }
        guard let http = response as? HTTPURLResponse else {
            throw APIError.network(URLError(.badServerResponse))
        }
        guard (200..<300).contains(http.statusCode) else {
            let message = (try? decoder.decode(APIErrorBody.self, from: data))?.message
                ?? String(data: data, encoding: .utf8)
                ?? "알 수 없는 오류"
            throw APIError.server(status: http.statusCode, message: message)
        }
        return data
    }

    private func send<Response: Decodable>(_ request: URLRequest) async throws -> Response {
        let data = try await sendRaw(request)
        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw APIError.decoding(error)
        }
    }
}
