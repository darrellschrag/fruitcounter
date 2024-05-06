fruits=("Apple" "Banana" "Melon" "Orange" "Pear")
targetver="4.14"
appendpoint="http://5e65d558-us-east.lb.appdomain.cloud:8080/fruit"

select_random() {
    printf "%s\0" "$@" | shuf -z -n1 | tr -d '\0'
}

upgraded=""
while [ true ]
do
   newVersion=$(ic ks cluster get -c mycluster-upgrades -json | jq '.masterKubeVersion')
   updated_string=${newVersion//\"/}

   if [[ $updated_string == ${targetver}* ]]
   then
      upgraded=" - UPGRADED!!"
   fi
   echo "master version: ${updated_string}${upgraded}"
   kubectl get pods -o wide
   selectedfruit=$(select_random "${fruits[@]}")
   echo $selectedfruit
   curl -H 'Content-Type: application/json' \
        -d '{ "fruit":"'"${selectedfruit}"'" }' \
        -X POST \
        ${appendpoint}
   echo "\n--------------"
   sleep 5
done
