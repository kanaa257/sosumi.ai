export interface SearchResult {
  title: string
  url: string
  description: string
  breadcrumbs: string[]
  tags: string[]
  type: string // 'documentation' | 'general' etc.
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
}

class SearchResultParser {
  private results: SearchResult[] = []
  private currentResult: Partial<SearchResult> = {}
  private currentBreadcrumbs: string[] = []
  private currentTags: string[] = []
  private isInResultTitle = false
  private isInResultDescription = false
  private isInBreadcrumb = false
  private isInTag = false

  getResults(): SearchResult[] {
    return this.results
  }

  private resetCurrentResult() {
    this.currentResult = {}
    this.currentBreadcrumbs = []
    this.currentTags = []
    this.isInResultTitle = false
    this.isInResultDescription = false
    this.isInBreadcrumb = false
    this.isInTag = false
  }

  private finalizeCurrentResult() {
    if (this.currentResult.title && this.currentResult.url) {
      this.results.push({
        title: this.currentResult.title,
        url: this.currentResult.url,
        description: this.currentResult.description || "",
        breadcrumbs: [...this.currentBreadcrumbs],
        tags: [...this.currentTags],
        type: this.currentResult.type || "unknown",
      })
    }
    this.resetCurrentResult()
  }

  element(element: Element) {
    // Start of a search result
    if (element.tagName === "li" && element.getAttribute("class")?.includes("search-result")) {
      this.finalizeCurrentResult() // Finalize previous result if any

      // Extract result type from class
      const className = element.getAttribute("class") || ""
      if (className.includes("documentation")) {
        this.currentResult.type = "documentation"
      } else if (className.includes("general")) {
        this.currentResult.type = "general"
      } else {
        this.currentResult.type = "other"
      }
    }

    // Result title link
    if (
      element.tagName === "a" &&
      element.getAttribute("class")?.includes("click-analytics-result")
    ) {
      const href = element.getAttribute("href")
      if (href) {
        this.currentResult.url = href.startsWith("/") ? `https://developer.apple.com${href}` : href
      }
      this.isInResultTitle = true
    }

    // Result description
    if (element.tagName === "p" && element.getAttribute("class")?.includes("result-description")) {
      this.isInResultDescription = true
    }

    // Breadcrumb items
    if (
      element.tagName === "li" &&
      element.getAttribute("class")?.includes("breadcrumb-list-item")
    ) {
      this.isInBreadcrumb = true
    }

    // Tag spans
    if (
      element.tagName === "span" &&
      element.parentElement?.getAttribute("class")?.includes("result-tag")
    ) {
      this.isInTag = true
    }

    // Tag list items (for languages like "Swift", "Objective-C")
    if (
      element.tagName === "li" &&
      element.getAttribute("class")?.includes("result-tag language")
    ) {
      this.isInTag = true
    }
  }

  text(text: Text) {
    const content = text.text.trim()
    if (!content) return

    if (this.isInResultTitle && this.currentResult.url) {
      this.currentResult.title = content
      this.isInResultTitle = false
    } else if (this.isInResultDescription) {
      this.currentResult.description = content
      this.isInResultDescription = false
    } else if (this.isInBreadcrumb) {
      this.currentBreadcrumbs.push(content)
      this.isInBreadcrumb = false
    } else if (this.isInTag) {
      this.currentTags.push(content)
      this.isInTag = false
    }
  }

  end() {
    this.finalizeCurrentResult() // Finalize the last result
  }
}

export async function searchAppleDeveloperDocs(query: string): Promise<SearchResponse> {
  const searchUrl = `https://developer.apple.com/search/?q=${encodeURIComponent(query)}`

  try {
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.status}`)
    }

    const parser = new SearchResultParser()

    const rewriter = new HTMLRewriter()
      .on("li.search-result", parser)
      .on("li.search-result a.click-analytics-result", parser)
      .on("li.search-result p.result-description", parser)
      .on("li.search-result li.breadcrumb-list-item", parser)
      .on("li.search-result li.result-tag", parser)
      .on("li.search-result li.result-tag span", parser)

    const transformedResponse = rewriter.transform(response)

    // We need to consume the response to trigger the parsing
    await transformedResponse.text()

    // Call end to finalize any remaining results
    parser.end()

    const results = parser.getResults()

    return {
      query,
      results,
    }
  } catch (error) {
    console.error("Error searching Apple Developer docs:", error)
    return {
      query,
      results: [],
    }
  }
}
