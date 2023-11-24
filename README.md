# Ubicomp-exercise-3
Everything for exercise-3 of the Ubicomp course at HSG

### 1 Get a Pod
created Pod under: https://solid.interactions.ics.unisg.ch/LukaTest/
with WebId: https://solid.interactions.ics.unisg.ch/LukaTest/profile/card#me

### 2 Interact with the Solid Server
unauthenticated HTTP GET request via Curl:
curl https://solid.interactions.ics.unisg.ch/LukaTest/profile/card#me

authenticated Request can be found under:
[AuthenticationRequest.mjs](AuthenticationRequest.mjs)

### 3 Create Resources
All Resources are created over class:
[Resource_creation.mjs](Resource_creation.mjs)

### 4 Share Resources
The sharing is managed over class:
[Resource_sharing.mjs](Resource_sharing.mjs)

I granted Lukas access to my Pod and we tested what he can access.
We found following:
myFriendsInfo.txt = he can access it (200) because 

myFamilyInfo.txt = he cant access it (403) because he is not authorized.
This is because i only granted him access to my test container

### 5 Solid App creation
The Solid App is added in:
[Resource_SolidAppCreation.mjs](Resource_SolidAppCreation.mjs)

a) method: createResource

b) method: 
Please note that it displays the name, currentactivity and probability on
the console and not in a unity application.

c)
method: addAuthorizationRuleFriends

I created a method which asks for the username of the friend you want to grant access to your 
Solid Pod resource (Lukas, Jan or Adrian). This function uses the readline module to interact via 
the command line, presenting a list of friends to choose from. You can select a friend by 
entering the corresponding number. Based on this selection, the function then adds
a new ACL  rule, specifying the chosen friend's WebID and the access 
rights they are granted (e.g., Read, Write). This new rule is added to the ACL file of the specified resource


d)
method: printActivityDetails
Takes the data from Lukas currentActivity file and displays it in the console. Same as b) just with his Pod


### 6 Solid App Query
The Solid App is added in:
[Resource_SolidAppQuery.mjs](Resource_SolidAppQuery.mjs)

a)-c) implemented

d)implemented through choosing the name of a friend

## Pittfalls
pitfalls:
1) For some reason i could not create Solid Pods with the emails i used to create the pods in web-based course (luka.bekavac@student.unisg.ch & bekavac@live.de) it gave me no error but also did not create new pods. Also i cant see my old pods anymore (i think it was "LukaBiceps")
it worked for me when using a third new mail luka@bekavac.de
2) took me some time to find out that the example URL in 4a) for 
authorization is wrong. 
It states <https://solid.int.ics.unisg.ch/kimPod/songs/aboutTime.txt>,
but it should be <https://solid.interactions.ics.unisg.ch/kimPod/songs/aboutTime.txt>
All of us had this problem and we could not access the hobbies.txt file we created, simply because we granted access to a not existing pod url.
3) Since i had no Unity application from Assignment 2 and the solid authentication and creation of the pods took me way longer than anticipated, i decided at some point to focus on the decentralized data storing 
and not on the Unity application.
