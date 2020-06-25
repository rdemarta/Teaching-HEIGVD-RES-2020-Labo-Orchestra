# Teaching-HEIGVD-RES-2020-Labo-Orchestra

## Admin

* **You can work in groups of 2 students**.
* It is up to you if you want to fork this repo, or if you prefer to work in a private repo. However, you have to **use exactly the same directory structure for the validation procedure to work**. 
* We expect that you will have more issues and questions than with other labs (because we have a left some questions open on purpose). Please ask your questions on Telegram / Teams, so that everyone in the class can benefit from the discussion.

## Objectives

This lab has 4 objectives:

* The first objective is to **design and implement a simple application protocol on top of UDP**. It will be very similar to the protocol presented during the lecture (where thermometers were publishing temperature events in a multicast group and where a station was listening for these events).

* The second objective is to get familiar with several tools from **the JavaScript ecosystem**. You will implement two simple **Node.js** applications. You will also have to search for and use a couple of **npm modules** (i.e. third-party libraries).

* The third objective is to continue practicing with **Docker**. You will have to create 2 Docker images (they will be very similar to the images presented in class). You will then have to run multiple containers based on these images.

* Last but not least, the fourth objective is to **work with a bit less upfront guidance**, as compared with previous labs. This time, we do not provide a complete webcast to get you started, because we want you to search for information (this is a very important skill that we will increasingly train). Don't worry, we have prepared a fairly detailed list of tasks that will put you on the right track. If you feel a bit overwhelmed at the beginning, make sure to read this document carefully and to find answers to the questions asked in the tables. You will see that the whole thing will become more and more approachable.


## Requirements

In this lab, you will **write 2 small NodeJS applications** and **package them in Docker images**:

* the first app, **Musician**, simulates someone who plays an instrument in an orchestra. When the app is started, it is assigned an instrument (piano, flute, etc.). As long as it is running, every second it will emit a sound (well... simulate the emission of a sound: we are talking about a communication protocol). Of course, the sound depends on the instrument.

* the second app, **Auditor**, simulates someone who listens to the orchestra. This application has two responsibilities. Firstly, it must listen to Musicians and keep track of **active** musicians. A musician is active if it has played a sound during the last 5 seconds. Secondly, it must make this information available to you. Concretely, this means that it should implement a very simple TCP-based protocol.

![image](images/joke.jpg)


### Instruments and sounds

The following table gives you the mapping between instruments and sounds. Please **use exactly the same string values** in your code, so that validation procedures can work.

| Instrument | Sound         |
|------------|---------------|
| `piano`    | `ti-ta-ti`    |
| `trumpet`  | `pouet`       |
| `flute`    | `trulu`       |
| `violin`   | `gzi-gzi`     |
| `drum`     | `boum-boum`   |

### TCP-based protocol to be implemented by the Auditor application

* The auditor should include a TCP server and accept connection requests on port 2205.
* After accepting a connection request, the auditor must send a JSON payload containing the list of <u>active</u> musicians, with the following format (it can be a single line, without indentation):

```
[
  {
  	"uuid" : "aa7d8cb3-a15f-4f06-a0eb-b8feb6244a60",
  	"instrument" : "piano",
  	"activeSince" : "2016-04-27T05:20:50.731Z"
  },
  {
  	"uuid" : "06dbcbeb-c4c8-49ed-ac2a-cd8716cbf2d3",
  	"instrument" : "flute",
  	"activeSince" : "2016-04-27T05:39:03.211Z"
  }
]
```

### What you should be able to do at the end of the lab


You should be able to start an **Auditor** container with the following command:

```
$ docker run -d -p 2205:2205 res/auditor
```

You should be able to connect to your **Auditor** container over TCP and see that there is no active musician.

```
$ telnet IP_ADDRESS_THAT_DEPENDS_ON_YOUR_SETUP 2205
[]
```

You should then be able to start a first **Musician** container with the following command:

```
$ docker run -d res/musician piano
```

After this, you should be able to verify two points. Firstly, if you connect to the TCP interface of your **Auditor** container, you should see that there is now one active musician (you should receive a JSON array with a single element). Secondly, you should be able to use `tcpdump` to monitor the UDP datagrams generated by the **Musician** container.

You should then be able to kill the **Musician** container, wait 10 seconds and connect to the TCP interface of the **Auditor** container. You should see that there is now no active musician (empty array).

You should then be able to start several **Musician** containers with the following commands:

```
$ docker run -d res/musician piano
$ docker run -d res/musician flute
$ docker run -d res/musician flute
$ docker run -d res/musician drum
```
When you connect to the TCP interface of the **Auditor**, you should receive an array of musicians that corresponds to your commands. You should also use `tcpdump` to monitor the UDP trafic in your system.


## Task 1: design the application architecture and protocols

| #  | Topic |
| --- | --- |
|Question | How can we represent the system in an **architecture diagram**, which gives information both about the Docker containers, the communication protocols and the commands? |
| | Remarque: les adresses IP représentées sur le diagramme correspondent au cas où seuls ces containers sont démarrés (l'Auditor en premier puis les Musician). <br/>![image](images/diagram.png) |
|Question | Who is going to **send UDP datagrams** and **when**? |
| | C'est le musicien qui va envoyer des données en UDP. Il va envoyer des données chaque seconde durant toute sa durée de vie. |
|Question | Who is going to **listen for UDP datagrams** and what should happen when a datagram is received? |
| | C'est le serveur qui va écouter et recevoir les données UDP provenant des musicien. Quand les données d'un musicien sont reçues, il doit mettre à jour sa structure de données afin de mettre à jour l'entrée correspondante au musicien qui à envoyer les données, pour avoir une structure toujours à jour. De plus, le serveur doit supprimer de se structure de données, tous les musiciens dont il n'a pas reçu de données depuis 5sec |
|Question | What **payload** should we put in the UDP datagrams? |
| | l'UUID du musicien, son instrument / son et l'heure courante pour le activeSince |
|Question | What **data structures** do we need in the UDP sender and receiver? When will we update these data structures? When will we query these data structures? |
| | **Emetteur:** Nous avons besoin d'une Map contenant les instruments disponibles, qui sera modifiée si l'on veut ajouter un instrument à notre application. **Receveur:** Nous avons besoin d'une Map (musicianMap) qui contiendra de manière unique (via UUID), tous les musiciens qui sont entrain de jouer. Elle va être mise à jour à chaque fois qu'un message est recu. De plus il va falloir supprimer les anciens musicians (qui ne jouent plus) après avoir update la Map et aussi quand on recoit un message TCP |


## Task 2: implement a "musician" Node.js application

| #  | Topic |
| ---  | --- |
|Question | In a JavaScript program, if we have an object, how can we **serialize it in JSON**? |
| | `JSON.stringify(<your_object>);` |
|Question | What is **npm**?  |
| | NPM est le gestionnaire de dépendance de Node.js.  |
|Question | What is the `npm install` command and what is the purpose of the `--save` flag?  |
| | Cette commande permet d'installer un package spécifique, celui-ci se retrouvera dans le dossier "node_modules". Le flag "--save" permet d'installer le package et directement mettre à jours les dependances dans le fichier "package.json".  |
|Question | How can we use the `https://www.npmjs.com/` web site?  |
| | Ce site répertories les packages Nod.js disponibles. Ainsi, on peut rechercher un package, avoir des infos sur celui-ci et voir comment il fonctionne pour enfin l'installer.  |
|Question | In JavaScript, how can we **generate a UUID** compliant with RFC4122? |
| | En utilisant la librairie recommandée [UUID](https://github.com/uuidjs/uuid), qui permet de générer des UUID selon la norme RFC4122.  |
|Question | In Node.js, how can we execute a function on a **periodic** basis? |
| | En utilisant la fonction js [setInterval()](https://www.w3schools.com/jsref/met_win_setinterval.asp), qui prend en paramètre la fonction à exécutée, l'interval en ms, puis optionellement des paramètres à passer à la fonction  |
|Question | In Node.js, how can we **emit UDP datagrams**? |
| | En utilisant la librairie accessible par défaut "dgram":<br/>`var dgram = require('dgram');`<br/>`var socket = dgram.createSocket('udp4');`<br/>`s.send(message, 0, message.length, port, address, function(err, bytes) { });` |
|Question | In Node.js, how can we **access the command line arguments**? |
| | Les arguments sont récupérables dans le tableau: `process.argv`. |


## Task 3: package the "musician" app in a Docker image

| #  | Topic |
| ---  | --- |
|Question | How do we **define and build our own Docker image**?|
| | On utilise la commande `docker build <nom_image> .` en mettant le Dockerfile dans le dossier courant |
|Question | How can we use the `ENTRYPOINT` statement in our Dockerfile?  |
| | Il faut mettre `ENTRYPOINT ["node", "<nom_script>"]` dans notre Dockerfile. Cela va permettre d'utiliser les arguments docker avec le script spécifié. |
|Question | After building our Docker image, how do we use it to **run containers**?  |
| | On utilise la commande `docker run res/musician <arg1> <arg2> <...>` en saisissant les arguments désirés à la fin. |
|Question | How do we get the list of all **running containers**?  |
| | Avec la commande `docker ps`.  |
|Question | How do we **stop/kill** one running container?  |
| | Avec `docker kill <container>` ou `docker stop <container>` |
|Question | How can we check that our running containers are effectively sending UDP datagrams?  |
| | En allant sniffer le réseau avec un logiciel comme wireshark. Sinon on peut aussi voir le traffique UDP sur le réseau en utilisant TCPDump. Ou encore, on peut simplement afficher les messages envoyés par les musiciens ou reçu par l'auditeur.  |


## Task 4: implement an "auditor" Node.js application

| #  | Topic |
| ---  | ---  |
|Question | With Node.js, how can we listen for UDP datagrams in a multicast group? |
| | On créé un socket et on écoute sur celui-ci:<br/>`const dgram = require('dgram');`<br/>`const socket = dgram.createSocket('udp4');`<br/>`const multicastAddress = '239.255.0.0';`<br/>`socket.bind(1234, function() { socket.addMembership('239.255.0.0'); });`<br/>`socket.on('message', function(msg, source) { /* Receive message */});`  |
|Question | How can we use the `Map` built-in object introduced in ECMAScript 6 to implement a **dictionary**?  |
| | Dans notre cas, on utilise de uuid comme clef et un objet JSON comme valeur:<br/>`var musicianMap = new Map();`<br/>`var jsonMsg = JSON.parse(msg);`</br>`	musicianMap.set(jsonMsg['uuid'], jsonMsg);` |
|Question | How can we use the `Moment.js` npm module to help us with **date manipulations** and formatting?  |
| | Par exemple, pour prendre la date et heure actuelle:<br/>`var moment = require('moment');`<br/>`var now = moment().format();`|
|Question | When and how do we **get rid of inactive players**?  |
| | Nous devons supprimer les musiciens inactifs à chaque fois (apres) qu'on ait mis à jour notre structure de donnée. Aussi, nous devons le faire quand quelqu'un se connecte en TCP, avant de lui envoyer les musiciens actifs. Pour ce faire il suffit de parcourir notre Map de musiciens et si la différence entre le temps courant et le dernier son émis par le musicien est plus grand que 5 sec, on le supprime de la map. |
|Question | How do I implement a **simple TCP server** in Node.js?  |
| | 
```js
const Net = require('net');
const TCP_port = 2205;
const TCP_server = new Net.Server();
// The server listens to a socket for a client to make a connection request.
TCP_server.listen(TCP_port, function() {
});

// When a client requests a connection with the server, the server creates a new socket dedicated to that client.
TCP_server.on('connection', function(tcpClientSocket) {
    // When the client requests to end the TCP connection with the server, the server
    tcpClientSocket.on('end', function() {
    });

    // Don't forget to catch error, for your own sake.
    tcpClientSocket.on('error', function(err) {
    });
});
```
|


## Task 5: package the "auditor" app in a Docker image

| #  | Topic |
| ---  | --- |
|Question | How do we validate that the whole system works, once we have built our Docker image? |
| | On peut lancer un auditor avec: `docker run -p 2205:2205 res/auditor`, puis on run un musicien qui joue au piano: `docker run res/musician piano`, puis un qui joue de la batterie: `docker run res/musician drum`. Ensuite, on se connecte en TCP avec telnet à l'adresse de l'auditeur et son port: `telnet 172.17.0.2 2205` la nous devrions recevoir un JSON contenant nos deux musiciens entrain de jouer. Pour finir, nous allons tuer le container qui joue de la batterie puis, attendre 5 secondes et relancer une connection TCP sur l'auditeur en telenet. A ce moment, nous devrions recevoir dans le JSON seulement le musicien jouant au piano. Notre système fonctionne donc entièrement. Si nous ne voulons pas tester nous-même, nous pouvons lancer le script `validate.sh` et voir que cela passe aussi tous les tests. |


## Constraints

Please be careful to adhere to the specifications in this document, and in particular

* the Docker image names
* the names of instruments and their sounds
* the TCP PORT number

Also, we have prepared two directories, where you should place your two `Dockerfile` with their dependent files.

Have a look at the `validate.sh` script located in the top-level directory. This script automates part of the validation process for your implementation (it will gradually be expanded with additional operations and assertions). As soon as you start creating your Docker images (i.e. creating your Dockerfiles), you should try to run it.
