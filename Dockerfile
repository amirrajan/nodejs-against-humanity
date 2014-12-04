FROM centos:centos6

RUN yum install -y git
RUN yum install -y curl
RUN yum install -y tar
RUN yum install -y man
RUN yum install -y which

RUN yum groupinstall -y "Development Tools"

RUN touch ~/.profile

RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.11.1/install.sh | bash
RUN \
	source ~/.profile && \
	nvm install v0.10.32 && \
	n=$(which node);n=${n%/bin/node}; chmod -R 755 $n/bin/*; cp -r $n/{bin,lib,share} /usr/local
	
ADD . /var/nodejs-against-humanity

# RUN mkdir -p /root/.ssh
# RUN cp /var/nodejs-against-humanity/id_rsa /root/.ssh/id_rsa
# RUN chmod 600 /root/.ssh/id_rsa
# RUN ssh-keyscan github.com >> /root/.ssh/known_hosts

WORKDIR /var/nodejs-against-humanity

RUN npm install

ENTRYPOINT ["npm"]