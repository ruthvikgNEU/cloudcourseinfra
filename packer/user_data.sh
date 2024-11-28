#!/bin/bash

echo "Running the bash script.."

sudo yum update -y

sudo yum upgrade -y

sudo yum install -y gcc-c++ make

curl -sL https://rpm.nodesource.com/setup_16.x | sudo -E bash -

sudo yum install -y nodejs


source ~/.bashrc



node -v

npm -v

which node

pwd
ls -a


unzip webapp.zip -d webapp-main

rm webapp.zip
# install codedeploy agent
sudo yum install amazon-cloudwatch-agent -y 
sudo cp -R "/home/ec2-user/webapp-main/cloud-watch-agent.json" "/opt/aws/amazon-cloudwatch-agent/etc/"
ls
cd webapp-main
touch combined.log
npm i --save
touch webapp.service
sudo cat >> webapp.service <<'EOF'
[Unit]
Description=webapp
After=multi-user.target
[Service]
EnvironmentFile=/home/ec2-user/webapp-main/.env
ExecStart=/usr/bin/node /home/ec2-user/webapp-main/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=webapp-server-log
User=ec2-user
[Install]
WantedBy=multi-user.target
EOF
sudo mv webapp.service /lib/systemd/system/webapp.service

which node
