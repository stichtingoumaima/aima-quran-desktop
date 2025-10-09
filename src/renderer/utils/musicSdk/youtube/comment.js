// Comments functionality for YouTube (stub implementation)
// YouTube doesn't provide easy access to comments via unofficial APIs
// This is a placeholder that returns empty results

export default {
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,

  // Get comments for a YouTube video (stub)
  getComments(videoId, page = 1, limit = 30) {
    console.log('💬 YouTube getComments called (stub):', { videoId, page, limit })

    // Return empty result as YouTube comments are not easily accessible
    return Promise.resolve({
      list: [],
      allPage: 0,
      limit: this.limit,
      total: 0,
      source: 'youtube',
    })
  },

  // Search comments (stub)
  search(str, page = 1, limit, retryNum = 0) {
    console.log('💬 YouTube comment search called (stub):', { str, page, limit })

    // Return empty result
    return Promise.resolve({
      list: [],
      allPage: 0,
      limit: this.limit,
      total: 0,
      source: 'youtube',
    })
  },

  // Add missing methods required by the interface
  getList() {
    return this.search('', 1, this.limit)
  },
}
