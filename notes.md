# Technology Consideration Notes

### Python
================
Python has a wealth of great natural language processing, math and machine learning libraries that can be extremely handy for what salient.io hopes to accomplish. Almost all of the scientific community uses python as the primary language for developing all sorts of algorithms and tests. It is vastly easier to lookup something in Python. That being said, it may be possible to port to other languages if necessary.

Some downfalls to the language are in the initial configuration and setup phase. While there are some tools available to deploy and sacle, there is a lot of work unfortunately not yet seen as far as scaling and handling other nuances in the language that you normally wouldn't have to worry about in things like C# (namespacing, input safety / validation, as well as modules that might not be fully tested or stable)

#### *Modules*
-------------------
Some modules for python of notable use include:

* NLTK - http://nltk.org/
* Pattern - https://github.com/clips/pattern


### Node.js
================
Massively parallel requests and highly concurrent applications are typically used with Node.js. Because of the way Node.js is structured, it's easier to scale out to thousands to hundreds of thousands of parallel requests with minimal hardware requirements. This makes it an advantagous platform to choose for quick performance. Additionally, if much of the api is json described, the language is inherently performant for that aspect and can easily store data without much effort for any translation. Since much of the web has turned to json web apis, this is another advantage of using it.

Node.js unfortunately does not have that many natural language toolkit modules so the majority of the work will be in building these out. The lightweight-ness of the framework makes this a desirable environment for scaling out and automating tooling. Much will need to be brought over in implementation from other languages likely from Java or Python but this is a possibility.

#### *Modules*
--------------------
Some modules for Node.js of notable use include:

* Natural
* Cluster
* Express.js
* HttpServer (built-into the framework itself)

### .NET 4.5
=================
C# is a beautiful language with a lot of constructs and nuances that have been taken from other languages over time. There are many things about C# that make it an incredibly productive language and development environment. There is much less worry about the structure of the application and more thought into implementation details. Things like dependency injection and integrated intellisense make it an advantagous language to use. 

.NET 4.5 isn't officially supported in Mono and deploying the platform behind IIS (while probably recommended for any web api) would be a disadvantage for performing other regular tasks such as monitoring performance, auto-scaling and low-cost deployment environments that make it useful to use things on Linux environments.
