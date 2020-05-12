const got = require('got')
const Errors = require('../errors')

module.exports = function (config, result) {
  return new Promise((resolve, reject) => {
    config.onlyFailed = config.onlyFailed || true
    if (!config.url) return reject(new Error('config.url is required for the "slack" report'))

    const url = new URL(config.url)

    if (true === config.onlyFailed && true === result.success) return resolve('[SLACK] No Notification is required because eveything is fine :)')

    function getStepsError() {
      return result
        .features
        .filter(_ => !_.result)
        .map(feature => {
          return feature
            .elements
            .filter(_ => !_.result)
            .map(scenario => {
              let step = scenario.steps.find(_ => 'failed' === _.result.status)
				      return {
				      	"type": "section",
				      	"text": {
				      		"type": "mrkdwn",
				      		"text": [
                    `📕 *Feature*: ${feature.feature_name}`,
                    `*Scenario*: ${scenario.name}`,
                    `*Failed step*: ${step.keyword} ${step.name} (Line ${step.line})`,
                    `\`\`\` ${step.result.error_message} \`\`\``,
                    '---'
                  ].join('\n')
				      	}
				      }
            })
        })
        .flat()
    }

    let status = result.success ? 'Passed': 'Failed'
    let blocks = [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `The test suite *${status} (${result.passed}/${result.total})*`
        }
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": `*Environment:* ${result.name}`
          },
          {
            "type": "mrkdwn",
            "text": `*uuid :* ${result.id}`
          }
        ]
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*Scenarios:* \n *  Passed: ${result.scenarios.passed} \n *  Failed: ${result.scenarios.failed} \n *  Skipped: ${result.scenarios.skipped} \n * Undefined: ${result.scenarios.undefined}`
        },
        "accessory": {
          "type": "image",
          "image_url": `https://restqa.io/assets/img/utils/restqa-logo-${status.toLowerCase()}.png`,
          "alt_text": 'status'
        }
      },
      {
        "type": "context",
        "elements": [
          {
            "type": "mrkdwn",
            "text": "*Powered By:*"
          },
          {
            "type": "mrkdwn",
            "text": "<https://restqa.io|@restqa>"
          }
        ]
      }
    ]

    if (config.showErrors) {
      blocks = blocks
      .concat(getStepsError())
    }

    if (config.reportUrl) {
      let section =	{
		  	"type": "section",
		  	"text": {
		  		"type": "mrkdwn",
		  		"text": `📊  <${config.reportUrl.replace('{uuid}', result.id)}|Acccess to the Test report>`
		  	}
		  }
      blocks = blocks.concat(section)
    }

  let data = {
    "attachments": [{
      "color": result.success ? "#007a5a" : "#ff0000",
      "blocks": blocks
    }]
  }

    const options = {
      hostname: url.hostname,
      port: url.port,
      protocol: url.protocol,
      pathname: url.pathname,
      method: 'POST',
      body: JSON.stringify(data)
    }

    got(options)
      .then(res => {
        resolve(`[SLACK REPORT][${res.statusCode}] - ${config.url}`)
      })
      .catch(err => {
        reject(new Errors.HTTP('HTTP REPORT', err))
      })
  })
}
