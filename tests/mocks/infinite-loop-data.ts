/**
 * Mock data that can cause infinite loops in reference resolution
 */

// Mock data with circular references in inline content
export const circularReferenceData = {
  metadata: {
    title: "Test Circular Reference",
    roleHeading: "Type",
  },
  abstract: [
    {
      type: "text",
      text: "A test type with circular references",
    },
  ],
  primaryContentSections: [
    {
      kind: "content",
      content: [
        {
          type: "paragraph",
          inlineContent: [
            {
              type: "text",
              text: "This references ",
            },
            {
              type: "reference",
              identifier: "doc://test/ref1",
              title: "Reference 1",
            },
            {
              type: "text",
              text: " which has ",
            },
            {
              type: "emphasis",
              inlineContent: [
                {
                  type: "reference",
                  identifier: "doc://test/ref2",
                  title: "Reference 2",
                },
                {
                  type: "strong",
                  inlineContent: [
                    {
                      type: "reference",
                      identifier: "doc://test/ref1", // Circular back to ref1
                      title: "Back to Reference 1",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  references: {
    "doc://test/ref1": {
      title: "Reference 1",
      url: "/test/ref1",
      abstract: [
        {
          type: "text",
          text: "This references ref2",
        },
      ],
    },
    "doc://test/ref2": {
      title: "Reference 2",
      url: "/test/ref2",
      abstract: [
        {
          type: "text",
          text: "This references ref1",
        },
      ],
    },
  },
}

// Mock data with deeply nested inline content that could cause stack overflow
export const deeplyNestedData = {
  metadata: {
    title: "Test Deep Nesting",
    roleHeading: "Type",
  },
  primaryContentSections: [
    {
      kind: "content",
      content: [
        {
          type: "paragraph",
          inlineContent: [
            {
              type: "emphasis",
              inlineContent: [
                {
                  type: "strong",
                  inlineContent: [
                    {
                      type: "emphasis",
                      inlineContent: [
                        {
                          type: "strong",
                          inlineContent: [
                            {
                              type: "emphasis",
                              inlineContent: [
                                {
                                  type: "text",
                                  text: "Very deeply nested text",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  references: {},
}

// Mock data with recursive list structures
export const recursiveListData = {
  metadata: {
    title: "Test Recursive Lists",
    roleHeading: "Type",
  },
  primaryContentSections: [
    {
      kind: "content",
      content: [
        {
          type: "unorderedList",
          items: [
            {
              content: [
                {
                  type: "paragraph",
                  inlineContent: [
                    {
                      type: "text",
                      text: "Item 1 with ",
                    },
                    {
                      type: "reference",
                      identifier: "doc://test/recursive",
                      title: "Recursive Reference",
                    },
                  ],
                },
                {
                  type: "unorderedList",
                  items: [
                    {
                      content: [
                        {
                          type: "paragraph",
                          inlineContent: [
                            {
                              type: "reference",
                              identifier: "doc://test/recursive",
                              title: "Another Recursive Reference",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  references: {
    "doc://test/recursive": {
      title: "Recursive Reference",
      url: "/test/recursive",
    },
  },
}
