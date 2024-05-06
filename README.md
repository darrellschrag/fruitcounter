# fruitcounter
This project will illustrate how you can upgrade ROKS will an app is running.

Perform the following steps
1. Create a ROKS Cluster (version 4.13)
2. Build the image using Docker or Podman using the Docker file <br>
   podman build -t us.icr.io/<namespace>/fruitcounter:1 .
3. Push the image to the IBM Cloud Container Registry <br>
   podman push us.icr.io/<namespace>/fruitcounter:1
4. Run the following commands to add some things to your cluster

    a. create a service account <br>
    $kubectl create servicaccount drs-service-account

    b. bind the service account to the cluster admin role <br>
    $kubectl create clusterrolebinding drs-clusterrole-binding --clusterrole=cluster-admin --serviceaccount=default:drs-service-account

    c. create a secret to hold your IBM Cloud API key <br>
    $kubectl create secret generic drs-api-key --from-literal=API_TOKEN="your token"

5. Modify deployment.yaml to specify the name of your image.
6. Deploy the application <br>
   $kubectl apply -f deployment.yaml
7. Expose the application <br>
   $oc expose deploy fruit-counter --port=8080 --target-port=8080 --type=LoadBalancer --name drs-lb-svc
8. After a bit (DNS assignment) find the external address of the app <br>
   $kubectl get svc drs-lb-svc
9. Might have to wait some more time (DNS propogate), launch the app <br>
   http://externaladdress:8080 <br>
   Show the worker node and OCP version of worker node on the result page. Do multiple times to show different workers respond.
10. edit loop.sh to update your upgrade target OCP version and your app endpoint
11. run loop.sh. 3 pods should show running on 3 separate workers
12. while loop is running, upgrade masters to 4.14. Eventually will show upgrade
13. while loop is running, upgrade a worker. You should see the pod on the worker being upgraded be moved to another worker
14. When worker is finished upgrading, kill one of the new pod that moved. A new pod should come up on the new worker and show the upgraded worker version.

