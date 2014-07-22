

/**
* Add rate limiting capabilities to a queue.
* The timeout should indicate the minimum number of milliseconds before
* invoking the next item in the queue.
* So for a 100/min. rate limit, use (60000 / 100)
*
* Invoke like
*      rateLimiter.call(queue);
*      queue.rateLimit(timeout);
*/
var rateLimiter = function () {
	var queue = this;

	// keep the original methods, so we can invoke them later on
	var _push = queue.push;
	var _drain = queue.drain;

	// copy the original tasks
	var internalQueue = queue.tasks.splice(0);
	queue.tasks = [];

	// number of items that need to finish
	var toProcess = internalQueue.length;

	// internal state
	this.$rateLimitTimeout = 0;
	this.$rateLimitBusy = false;
	this.$rateLimitInterval = null;

	// wrapper around push that pushes to our own queue instead of tasks
	this.push = function (data, callback) {
		if(data.constructor !== Array) {
			data = [data];
		}
		data.forEach(function (task) {
			internalQueue.push({ data: task, callback: callback });
		});

		toProcess += data.length;
	};

	// kick off the rate limiter
	this.rateLimit = function (timeout) {
		this.$rateLimitTimeout = timeout || 1000;
		this.$processNextRateLimited();
	};

	// invoke the rate limit implementation with a timeout
	this.$processNextRateLimited = function () {
		var self = this;

		self.$rateLimitInterval = setInterval(function () {
			self.$processNextRateLimitedImpl();
		}, self.$rateLimitTimeout);
	};

	// process the next item in our rate limited queue
	this.$processNextRateLimitedImpl = function () {
		var self = this;

		// grab next item...
		// disadvantage of this approach (doing it in the impl) is that the event loop will die
		// 1 timeout later than required. Might need to fix that one day.
		var item = internalQueue.shift(0);
		if (!item) {
			return;
		}

		// we're busy
		self.$rateLimitBusy = true;

		// the 'drain' function can be overwritten at this point,
		// as we don't have control over when it happens...
		if (self.drain !== $emptyDrain) {
			_drain = self.drain;
			self.drain = $emptyDrain;
		}

		// invoke original push function of the queue
		_push(item.data, function () {
			if (typeof item.callback === "function") {
				item.callback.apply(this, arguments);
			}

			toProcess -= 1;

			if (toProcess === 0) {
				self.$rateLimitBusy = false;

				clearInterval(self.$rateLimitInterval);

				if (typeof _drain === "function") {
					_drain();
				}
			}
		});
	};

	var $emptyDrain = function () {};

	// the original drain function of a queue needs to be overwritten
	// otherwise the user will be flooded with messages
	this.drain = $emptyDrain;
};

module.exports = rateLimiter;
