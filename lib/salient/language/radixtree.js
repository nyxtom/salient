/*
The MIT License

Copyright (c) 2008 Javid Jamae

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/**
 * Author: Javid Jamae
 * Website: http://www.javidjamae.com/
 */
function RadixTree() {
    this.rootNode = { k: "", e: [] };
    
    this.insert = function(key) {
        this._insertInternal(key, this.rootNode)
    }
    
    this._insertInternal= function(key, node) {
        if (isStringSubNode(node, key)) {
            this._addNodeOrRecurse(key, node);
        } else if (key == node.k) {
            this._makeNodeDataNode(key, node);
        } else if (isStringPartialMatch(node, key)) {
            this._splitNode(key, node);
        } else {                
            this._addNodeAsChild(key, node);
        }
    }
    
    this._addNodeOrRecurse = function(key, node) {
        var addedToChild = false
        var newText = getMatchingPortionOfString(node, key);
        for (var j = 0; j<node.e.length; j++) {
            if (node.e[j].k.startsWith(newText.charAt(0))) {
                addedToChild = true
                this._insertInternal(newText, node.e[j])
                break
            }
        }

        if (addedToChild == false) {
            var n = { k: newText, e: [], r: true };
            node.e.push(n);
        }
    }
    
    this._makeNodeDataNode = function(key, node) {
        if (node.r) {
            throw "Duplicate key";
        }
        node.r = true;
    }
    
    this._addNodeAsChild = function(key, node) {
        console.log("This doesn't ever seem to be called. If you see this alert, you just found a case where it is. You now have reason to remove this alert.");
        var n = deepCopy(node);
        n.k = (getMatchingPortionOfNodeKey(node, key));
        node.k = (key);
        node.r = (true);
        node.e.push(n);
    }
    
    this._splitNode = function(key, node) {
        var n1 = deepCopy(node);
        n1.k = (getMatchingPortionOfNodeKey(node, key));
        node.k = (getUnmatchingPortionOfString(node, key));
        node.r = (false);
        node.e = [];
        node.e.push(n1);
          
        if(getNumberOfMatchingCharacters(node, key) < key.length) {
            var n2 = { e: [], r: true };
            n2.k = (getMatchingPortionOfString(node, key));
            n2.r = (true);
            node.e.push(n2);
        } else {
            node.r = (true);
        }
    }
    
    /**
     * searchString - Any string to search for
     * limit - the number of results to find before returning
     */
    this.search = function(searchString, recordLimit) {
        var visitor = new Visitor()
        
        visitor.result = new Array()
        
        visitor.visit = function(key, parent, node) {
            if (node.r) {
                this.result.push(node.value)
            }
        }
        visitor.shouldVisit = function(key, node) {
            return node.k.startsWith(key) && this.result.length < recordLimit;
        }
        visitor.shouldRecurse = function(key, node){
            return this.result.length < recordLimit;
        }
        visitor.shouldVisitChild = function(key, childNode) {
            return childNode.k.startsWith(key.charAt(0)) && this.result.length < recordLimit;
        }

        this.visit(searchString, visitor)
        
        return visitor.result
    }   
    
    this.find = function(key) {
        var visitor = new Visitor()
        visitor.visit = function(key, parent, node) {
            if (node.r) {
                this.result = true
            }
        }
        visitor.shouldVisit = function(key, node) {
            return key == node.k
        }
        visitor.shouldRecurse = function(key, node){
            return isStringSubNode(node, key)
        }
        visitor.shouldVisitChild = function(key, childNode) {
            return childNode.k.startsWith(key.charAt(0))
        }
        this.shouldBreakAfterFindingChild = function() {
            return true;
        }

        this.visit(key, visitor)
        return visitor.result
    }

    this.visit = function(key, visitor) {
        this._visitInternal(key, visitor, null, this.rootNode);
    }
    
    this._visitInternal = function(prefix, visitor, parent, node) {
        if (visitor.shouldVisit(prefix, node)) {
            visitor.visit(prefix, parent, node);
        }
        if (visitor.shouldRecurse(prefix, node)) {
            var newText = getMatchingPortionOfString(node, prefix);
            for (var j = 0; j < node.e.length; j++) {
                // recursively search the child nodes
                if (visitor.shouldVisitChild(newText, node.e[j])) {
                    this._visitInternal(newText, visitor, node, node.e[j]);
                    if (visitor.shouldBreakAfterFindingChild()) {
                        break;
                    }
                }
            }
        }
    }
    
    this.getNumberOfRealNodes = function() {
        var visitor = new Visitor()
        visitor.result = 0;
        
        visitor.visit = function(key, parent, node) {
            if (node.r) {
                this.result++;
            } 
        }
        visitor.shouldVisit = function(key, node) {
            return true
        }
        visitor.shouldRecurse = function(key, node){
            return true
        }
        visitor.shouldVisitChild = function(key, childNode) {
            return true
        }
        
        this.visit("", visitor)
        return visitor.result
    }
    
    this.getNumberOfNodes = function() {
        var visitor = new Visitor()
        visitor.result = 0;
        
        visitor.visit = function(key, parent, node) {
            this.result++;
        }
        visitor.shouldVisit = function(key, node) {
            return true
        }
        visitor.shouldRecurse = function(key, node){
            return true
        }
        visitor.shouldVisitChild = function(key, childNode) {
            return true
        }
        
        this.visit("", visitor)
        return visitor.result
    }
}

function escapeRegExp(str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

String.prototype.startsWith = function(str) {
    return this.match("^" + escapeRegExp(str)) == str
}

Array.prototype.contains = function (element) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == element) 
            {
                return true;
            }
        }
    return false;
};

function isStringSubNode(node, someString) {
    if (node.k == "") {
        return true;
    } else {
        return (getNumberOfMatchingCharacters(node, someString) < someString.length)
            && (getNumberOfMatchingCharacters(node, someString) >= node.k.length);
    }
}

function getNumberOfMatchingCharacters(node, key) {
    var result = 0
    while (result < key.length && result < node.k.length) {
        if (key.charAt(result) != node.k.charAt(result)) {
            break;
        }
        result++
    }
    return result;
}

function getMatchingPortionOfString(node, someString) {
    return someString.substring(getNumberOfMatchingCharacters(node, someString));
}

function getMatchingPortionOfNodeKey(node, someString) {
    return node.k.substring(getNumberOfMatchingCharacters(node, someString));
}

function getUnmatchingPortionOfString(node, someString) {
    return someString.substring(0, getNumberOfMatchingCharacters(node, someString));
}

function isStringPartialMatch(node, someString) {
    return getNumberOfMatchingCharacters(node, someString) > 0 
        && getNumberOfMatchingCharacters(node, someString) < node.k.length;
}

function deepCopy(node) {
    var result = {};
    result.k = node.k;
    result.e = node.e;
    result.r = node.r;
    return result;
}    

function Visitor() {
    var result;
    this.getResult = function() {
        return this.result
    }
    this.shouldBreakAfterFindingChild = function() {
        return false;
    }
}

module.exports = RadixTree;
