describe('#services - Channels', () => {
  test('init module', () => {
    const index = require('./index')
    expect(Object.keys(index).length).toEqual(9)
    expect(Object.keys(index)).toEqual([
      'http',
      'http-html-report',
      'elastic-search',
      'file',
      'slack',
      'microsoft-teams',
      'discord',
      'line',
      'mattermost'
    ])
  })
})
