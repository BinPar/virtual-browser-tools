#!/usr/bin/env bash

PATH_TO_ROOT_APP_REPLACE_STRING='__pathToRootOfProject__'
PATH_TO_LOGS_DIR_REPLACE_STRING='__pathToLogsDir__'

function echoUsage {
    printf "\n"
    echo "---------------------------------------------------------------------"
    printf "\tUSAGE:\n\t./deploy.sh [FILE_OR_DIR_EXCLUSION_PATTERN]\n"
    printf "\n\tConfiguration in deploy.json file. PROPERTIES:\n"
    printf "\t\tuid - Application name\n"
    printf "\t\tBP_appPort - Application port\n"
    printf "\t\tsourceDir - Relative path to the main NodeJS SCRIPT of application\n"
    echo "---------------------------------------------------------------------"
    printf "\n"
}

while IFS='' read -r line || [[ -n "$line" ]]; do
    if [[ $line =~ \"uid\"\: ]]
    then
        splitByColon=(${line//:/ })
        afterColon=${splitByColon[1]}
        splitByQuotes=(${afterColon//\"/ })
        APP_NAME=${splitByQuotes[0]}
        break
    fi
done < "deploy.conf"

if [ -z "$APP_NAME" ]
then
    printf "Nombre de aplicación no especificado, por favor use el archivo deploy.conf [propiedad 'uid']\n"
    echoUsage
    exit -1
fi

APP_DIR=/opt/$APP_NAME
APP_CURRENT_PATH=$APP_DIR/current
APP_LOGS_PATH=$APP_DIR/logs

#replace patterns with docker absolute paths
DOCKER_PATH_TO_APP="\/bundle"
DOCKER_PATH_TO_LOGS="\/logs"
cp deploy.conf deploy.json
sed -i '' "s/$PATH_TO_ROOT_APP_REPLACE_STRING/$DOCKER_PATH_TO_APP/g" deploy.json
sed -i '' "s/$PATH_TO_LOGS_DIR_REPLACE_STRING/$DOCKER_PATH_TO_LOGS/g" deploy.json

while IFS='' read -r line || [[ -n "$line" ]]; do
    if [[ $line =~ \"uid\"\: ]]
    then
        splitByColon=(${line//:/ })
        afterColon=${splitByColon[1]}
        splitByQuotes=(${afterColon//\"/ })
        APP_NAME=${splitByQuotes[0]}
    elif [[ $line =~ \"BP_appPort\"\: ]]
    then
        splitByColon=(${line//:/ })
        afterColon=${splitByColon[1]}
        splitByQuotes=(${afterColon//\"/ })
        APP_PORT=${splitByQuotes[0]}
    elif [[ $line =~ \"sourceDir\"\: ]]
    then
        splitByColon=(${line//:/ })
        afterColon=${splitByColon[1]}
        splitByQuotes=(${afterColon//\"/ })
        APP_SCRIPT_PATH=${splitByQuotes[0]}
    elif [[ $line =~ \"BP_dataVolumePath\"\: ]]
    then
        splitByColon=(${line//:/ })
        afterColon=${splitByColon[1]}
        splitByQuotes=(${afterColon//\"/ })
        DATA_VOLUME_PATH=${splitByQuotes[0]}
    fi
done < "deploy.json"

if [ -z "$APP_PORT" ]
then
    printf "Puerto no especificado, por favor use el archivo deploy.json [propiedad 'BP_appPort']\n"
    echoUsage
    exit -1
fi
if [ -z "$APP_SCRIPT_PATH" ]
then
    printf "No se ha especificado el path del directorio que contiene el script de inicio de la aplicación. [Propiedad 'sourceDir']\n"
    echoUsage
    exit -1
fi
tmpPathName=$(date +%s)
ARCHV_NAME=$APP_NAME"_"$tmpPathName.tar.gz
EXCLUSION_PATTERN=$1
if [ -n "$EXCLUSION_PATTERN" ]
then
    find . -type f ! -path '*node_modules*' ! -name 'deploy.sh' ! -name 'deploy.conf' ! -name $ARCHV_NAME ! -path "$EXCLUSION_PATTERN" | tar -T - -czf $ARCHV_NAME
else
    find . -type f ! -path '*node_modules*' ! -name 'deploy.sh' ! -name 'deploy.conf' ! -name $ARCHV_NAME | tar -T - -czf $ARCHV_NAME
fi
scp $ARCHV_NAME root@ada.binpar.com:~/
rm $ARCHV_NAME
rm deploy.json

APP_HOSTNAME=Ada-${APP_NAME//_/-}
numberOfDockers=$(ssh root@ada.binpar.com "docker ps -f \"name=$APP_NAME\" -q | wc -l")
ssh root@ada.binpar.com << EOF
 if [ -z ${APP_DIR+x} ] || [ -z ${APP_NAME+x} ] || [ -z ${APP_CURRENT_PATH+x} ] || [ -z ${APP_LOGS_PATH+x} ]
 then
    echo "ERROR: main variables are not set"
    exit 0
 fi
 if [ ! -d $APP_DIR ]
 then
    mkdir $APP_DIR
 fi
 if [ -d $APP_CURRENT_PATH ]
 then
    if [ -n "$EXCLUSION_PATTERN" ]
    then
        find $APP_CURRENT_PATH -type f ! -path '*node_modules*' ! -path "$EXCLUSION_PATTERN" -exec rm -f {} +
    else
        find $APP_CURRENT_PATH -type f ! -name '*node_modules*' -exec rm -f {} +
    fi
 else
    mkdir $APP_CURRENT_PATH
 fi
 mv ~/$ARCHV_NAME $APP_CURRENT_PATH/
 cd $APP_CURRENT_PATH
 tar -xzf ./$ARCHV_NAME
 rm ./$ARCHV_NAME
 if [ ! -d $APP_LOGS_PATH ]
 then
    mkdir $APP_LOGS_PATH
 fi

 docker rm -f $APP_NAME
 docker pull mgonand/dockerimages:nodescreen
 if [ "$APP_SCRIPT_PATH" = "/bundle" ] && [ ! -z ${DATA_VOLUME_PATH+x} ]
 then
     docker run \
        -d \
        --restart=on-failure:3 \
        --publish=127.0.0.1:$APP_PORT:80 \
        --volume=$APP_CURRENT_PATH:/bundle \
        --volume=$APP_LOGS_PATH:/logs \
        --volume=$DATA_VOLUME_PATH:/data \
        --link=mongodb:mongodb \
        --link=mail:mail \
        --hostname="$APP_HOSTNAME" \
        --name=$APP_NAME \
        mgonand/dockerimages:nodescreen
 elif [[ "$APP_SCRIPT_PATH" != "/bundle" ]] && [ ! -z ${DATA_VOLUME_PATH+x} ]
 then
     docker run \
        -d \
        --restart=on-failure:3 \
        --publish=127.0.0.1:$APP_PORT:80 \
        --volume=$APP_CURRENT_PATH:/bundle \
        --volume=$APP_LOGS_PATH:/logs \
        --volume=$DATA_VOLUME_PATH:/data \
        --link=mongodb:mongodb \
        --link=mail:mail \
        --hostname="$APP_HOSTNAME" \
        --env=APP_NODE_DIR=$APP_SCRIPT_PATH \
        --name=$APP_NAME \
        mgonand/dockerimages:nodescreen
 elif [[ "$APP_SCRIPT_PATH" != "/bundle" ]] && [ -z ${DATA_VOLUME_PATH+x} ]
 then
     docker run \
        -d \
        --restart=on-failure:3 \
        --publish=127.0.0.1:$APP_PORT:80 \
        --volume=$APP_CURRENT_PATH:/bundle \
        --volume=$APP_LOGS_PATH:/logs \
        --link=mongodb:mongodb \
        --link=mail:mail \
        --hostname="$APP_HOSTNAME" \
        --env=APP_NODE_DIR=$APP_SCRIPT_PATH \
        --name=$APP_NAME \
        mgonand/dockerimages:nodescreen
 else
     docker run \
        -d \
        --restart=on-failure:3 \
        --publish=127.0.0.1:$APP_PORT:80 \
        --volume=$APP_CURRENT_PATH:/bundle \
        --volume=$APP_LOGS_PATH:/logs \
        --link=mongodb:mongodb \
        --link=mail:mail \
        --hostname="$APP_HOSTNAME" \
        --name=$APP_NAME \
        mgonand/dockerimages:nodescreen
 fi
 echo "Done in server side... exit"
 exit 0
EOF

echo "=> [OK] Deploy complete!"
exit 0