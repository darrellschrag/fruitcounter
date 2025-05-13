kubectl create servicaccount fruitcounter-service-account
kubectl create clusterrolebinding fruitcounter-clusterrole-binding --clusterrole=cluster-admin --serviceaccount=default:fruitcounter-service-account
kubectl create secret generic fruitcounter-api-key --from-literal=API_TOKEN=<my key>
oc expose deploy fruit-counter --port=8080 --target-port=8080 --type=LoadBalancer --name fruitcounter-lb-svc