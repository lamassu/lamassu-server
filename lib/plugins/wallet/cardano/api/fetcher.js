const assert = require('assert')

class CardanoApiFetcher {
  constructor(client, port, hostname = 'localhost') {
    this.client = client
    this.port = port
    this.hostname = hostname
  }

  async fetch(endpoint, params, data, returnFullResponse = false) {
    const method = data ? 'POST' : 'GET'

    const url = `https://${this.hostname}:${this.port}/api/v1/${endpoint}`

    return this.client({
      method,
      url,
      params,
      data
    }).then(response => {
      if (response.error) throw response.error

      if (returnFullResponse) {
        return response
      }

      return response.data.data
    })
  }

  async fetchAllPages(endpoint, params, data) {
    let page = params.page || 1
    let result = []

    let totalEntries = null

    while (true) {
        const response = await this.fetch(endpoint, { ...params, page }, data, true)

        const meta = response.data.meta
        const rows = response.data.data

        assert(Array.isArray(rows), 'Response must be array')
        assert(meta.pagination.totalPages >= page)
        if (totalEntries !== null) {
            assert(meta.totalEntries === totalEntries) // TODO: maybe throw our own error, this is runtime error
        } else {
            totalEntries = meta.totalEntries
        }

        result = result.concat(response.data.data)
        if (page === meta.pagination.totalPages) {
            return result
        }
        page++
    }
  }
}

module.exports = CardanoApiFetcher
