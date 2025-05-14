// express webserver https://www.npmjs.com/package/express
// & HTTP body parsing middleware https://www.npmjs.com/package/body-parser
const express = require('express')
const bodyParser = require('body-parser')

// the official Node.js Cloudant library - https://www.npmjs.com/package/@ibm-cloud/cloudant
const { CloudantV1 } = require('@ibm-cloud/cloudant')
const client = CloudantV1.newInstance()
const DBNAME = 'fruitcounter'

const os = require('os')
// const HOSTNAME = process.env.HOSTNAME
// const HOSTNAME = os.hostname()

// constants
const PORT = 8080 // the default for Code Engine
const DESIGN_DOC = 'fruitCounter'

const { KubeConfig, CoreV1Api } = require('@kubernetes/client-node');
const { validateHeaderValue } = require('http')
const NODENAME = String(process.env.NODENAME)
console.log(`${NODENAME}`)
const getOpenShiftVersion = async function () {
  try {
      // Load kubeconfig from the cluster
      const kubeconfig = new KubeConfig();
      kubeconfig.loadFromCluster();

      // Create an instance of the CoreV1Api
      const k8sCoreApi = kubeconfig.makeApiClient(CoreV1Api);

      // Get the node information
      const thenode = await k8sCoreApi.readNode(NODENAME);
      const labels = thenode.body.metadata.labels;
      if (labels && labels["ibm-cloud.kubernetes.io/worker-version"]) {
        return labels["ibm-cloud.kubernetes.io/worker-version"]
      } else {
        throw new Error(`Label ibm-cloud.kubernetes.io/worker-version not found`);
      }
  } catch (error) {
      console.error("Error occurred:", error);
      return "darrell";
  }
}


// the express app with:
// - static middleware serving out the 'public' directory as a static website
// - the HTTP body parsing middleware to handling POSTed HTTP bodies
const app = express()
app.use(express.static('public'))
app.use(bodyParser.json())

// utility function to create a design document to count the frequency of each fruit type
const createDesignDoc = async function () {
  // for more information on Cloudant design documents see https://cloud.ibm.com/docs/Cloudant?topic=Cloudant-views-mapreduce
  // first see if the ddoc already exists

  try {
    // if the design document exists
    await client.getDesignDocument({
      db: DBNAME,
      ddoc: DESIGN_DOC
    })

    // nothing to do, it already exists
    console.log('design document exists')
  } catch (e) {
    // does not exist, so create it
    console.log('Creating design document')
    const designDoc = {
      views: {
        test: {
          // count occurrences within the index
          reduce: '_count',
          // simple map function to create an index on the 'fruit' attribute
          map: 'function (doc) {\n  emit(doc.fruit, null);\n}'
        }
      }
    }
    await client.putDesignDocument({
      db: DBNAME,
      designDocument: designDoc,
      ddoc: DESIGN_DOC
    })
  }
}

createDesignDoc()
var OCPVersion = "drs"
getOpenShiftVersion().then((value) => {
   console.log(`${value}`)
   OCPVersion = value
})
.catch((error) => {
   console.error(`Error:`,error)
})

// respond to POST requests to the /fruit endpoint
app.post('/fruit', async (req, res) => {
  // extract the chosen fruit from the POSted body
  const fruit = req.body.fruit

  // build the document to save to Cloudant
  const fruitDocument = {
    fruit: fruit,
    timestamp: new Date().toISOString()
  }

  // Save the document in the database
  await client.postDocument({
    db: DBNAME,
    document: fruitDocument
  })

  // now retrieve totals using a MapReduce view
  const totals = await client.postView({
    db: DBNAME,
    ddoc: DESIGN_DOC,
    view: 'test',
    group: true
  })
  const HOSTINFO = `${NODENAME} - ${OCPVersion}`
  console.log(`${HOSTINFO}`)
  res.send( {totals: totals.result.rows, host: HOSTINFO} )
})

// start the webserver
app.listen(PORT)
console.log(`Running on http://localhost:${PORT}`)
