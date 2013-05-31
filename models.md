## Data Models

From previous experience, statistics within salient.io need to be stored in such a way that various types of functions can be formulated as well as the ability to store any kind of dynamic data (whether that's numeric or not). Since quantitative analysis is a core business aspect, this should be carefully considered.

### Statistics

In order to properly store and run analysis on queries, there needs to be careful consideration to the proper database and storage engines that will be used to power salient.io's backend services. Considerations should be made to the following features of storage and computation:

* Compactness / Compression
* Map/Reduce Functionality for dynamic computation
* Selective Queries
* High Write Load
* High Read Load
* High Availability
* Minimal Replication
* Write-Ahead Log
* ACID Compliant
* Dynamic Structure

Structure of the data, at least for metrics may come in the following form:

```
{
    "_id": "time-sourceid-period",
    "sourceid": "sourceid",
    "time": NumberLong("1361404800000"),
    "updatetime": NumberLong("1369364028990"),
    "timebuckets": [
      "2013-02-21-day",
		"2013-8-week",
		"2013-02-month",
		"2013-year"
    ],
    "period": 30,
    "measures": {
    	"cpu_percent": 0.04,
    	"pid": 557
    },
    "attributes": {
    	"machine-name": "asimov-local",
    	"ip-address": "127.0.0.1"
    }
}
```

### Language Corpus

Since language data is a key business aspect to salient.io (a core product even), it is imperative that the corpus is available to all services. This requires that all language data be available in a caching solution that can be easily retrieved and stored in memory for quick/immediate lookups. Considerations need to be made as far as the amount of data available and the types of operations that might be formed, as well as the general expansion of the corpus.
