# fruitcounter
This project will illustrate how you can upgrade ROKS while an app is running.

Perform the following steps
1. Create a Cloudant service. The free tier is fine. Save the preferred external endpoint.
2. Create a ROKS Cluster (I created version 4.13)
3. Build the image using Docker or Podman using the Docker file <br>
   podman build -t us.icr.io/yournamespace/fruitcounter:1 .
4. Push the image to the IBM Cloud Container Registry <br>
   podman push us.icr.io/yournamespace/fruitcounter:1
5. Run the following commands to add some things to your cluster

    a. create a service account <br>
    $kubectl create serviceaccount fruitcounter-service-account

    b. bind the service account to the cluster admin role <br>
    $kubectl create clusterrolebinding fruitcounter-clusterrole-binding --clusterrole=cluster-admin --serviceaccount=default:fruitcounter-service-account

    c. create a secret to hold your IBM Cloud API key needed for Cloudant<br>
    $kubectl create secret generic fruitcounter-api-key --from-literal=API_TOKEN="your token"
6. Add the label "app: fruit-counter" to the 3 worker nodes. <br>
   $kubectl label nodes <nodename> app=fruit-counter
7. Modify deployment.yaml to specify the name of your image AND your specific Cloudant external endpoint
8. Deploy the application <br>
   $kubectl apply -f deployment.yaml
9. Verify you have 3 pods running successfully <br>
   $kubectl get pods
10. Expose the application <br>
   $oc expose deploy fruit-counter --port=8080 --target-port=8080 --type=LoadBalancer --name=fruitcounter-lb-svc
11. After a bit (DNS assignment) find the external address of the app <br>
   $kubectl get svc fruitcounter-lb-svc
12. Might have to wait some more time for it to work (DNS propogate), launch the app (do not use https) <br>
   http://externaladdress:8080 <br>
   Show the worker node and OCP version of worker node on the result page. Do multiple times to show different workers respond.
13. edit loop.sh to update your upgrade target OCP version and your app endpoint
14. run loop.sh. 3 pods should show running on 3 separate workers
15. while loop is running, upgrade masters to your target version. Eventually will show upgrade.

