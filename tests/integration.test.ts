import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fetchJSONData } from "../src/lib/fetch"
import { renderFromJSON } from "../src/lib/render"
import arrayData from "./fixtures/array.json"

describe("Integration Tests with Mocked Apple API", () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it("should fetch and render Apple documentation with mocked API response", async () => {
    // Mock fetch directly
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(arrayData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    // Test the full pipeline: fetchJSONData -> renderFromJSON
    const jsonData = await fetchJSONData("/documentation/swift/array")
    const markdown = await renderFromJSON(
      jsonData,
      "https://developer.apple.com/documentation/swift/array",
    )

    expect(markdown).toContain("# Array")
    expect(markdown).toContain("> An ordered, random-access collection.")
    expect(markdown).toContain("*Extracted by [sosumi.ai](https://sosumi.ai)")

    // Verify the correct Apple API was called
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
      "https://developer.apple.com/tutorials/data/documentation/swift/array.json",
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": expect.stringMatching(/Safari/),
          Accept: "application/json",
          "Cache-Control": "no-cache",
        }),
      }),
    )
  })

  it("should handle Apple API errors gracefully", async () => {
    // Mock a 404 response from Apple's API
    global.fetch = vi.fn().mockResolvedValue(new Response("Not Found", { status: 404 }))

    await expect(fetchJSONData("/documentation/swift/nonexistent")).rejects.toThrow()
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it("should handle network errors when fetching from Apple", async () => {
    // Mock a network error
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"))

    await expect(fetchJSONData("/documentation/swift/array")).rejects.toThrow("Network error")
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it("should handle framework index requests", async () => {
    const mockFrameworkData = {
      metadata: { title: "Swift" },
      references: {},
      primaryContentSections: [],
    }

    global.fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(mockFrameworkData), { status: 200 }))

    const jsonData = await fetchJSONData("/documentation/swift")
    const markdown = await renderFromJSON(
      jsonData,
      "https://developer.apple.com/documentation/swift",
    )

    expect(markdown).toContain("# Swift")

    // Should call the framework index endpoint
    expect(global.fetch).toHaveBeenCalledWith(
      "https://developer.apple.com/tutorials/data/index/swift",
      expect.any(Object),
    )
  })

  it("should use correct user agent and headers for Apple API requests", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(arrayData), { status: 200 }))

    await fetchJSONData("/documentation/swift/array")

    expect(global.fetch).toHaveBeenCalledTimes(1)
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(call[0]).toBe(
      "https://developer.apple.com/tutorials/data/documentation/swift/array.json",
    )
    expect(call[1].headers["User-Agent"]).toMatch(/AppleWebKit/)
    expect(call[1].headers.Accept).toBe("application/json")
    expect(call[1].headers["Cache-Control"]).toBe("no-cache")
  })

  it("should handle concurrent requests efficiently", async () => {
    // Mock successful response for all requests - create new Response each time
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(arrayData), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    )

    // Make concurrent requests
    const promises = [
      fetchJSONData("/documentation/swift/array"),
      fetchJSONData("/documentation/swift/string"),
      fetchJSONData("/documentation/swift/dictionary"),
    ]

    const results = await Promise.all(promises)

    // All should succeed
    results.forEach((result) => {
      expect(result).toBeDefined()
      expect(result.metadata).toBeDefined()
    })

    // Should have made 3 fetch calls to Apple API
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })
})
