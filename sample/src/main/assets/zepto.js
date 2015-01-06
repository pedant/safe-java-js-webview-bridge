/* Zepto v1.0-1-ga3cab6c - polyfill zepto detect event ajax form fx - zeptojs.com/license */
/* modified by Pedant from line 508 to 515 */
;(function(undefined) {
    if (String.prototype.trim === undefined) // fix for iOS 3.2
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, '')
        }

    // For iOS 3.x
    // from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
    //这个方法的作用就是累似一个累计处理的作用，将前一条数据的处理结果用作下一次的处理
    //比如[1,2,3,4,].reduce(function(x,y){ return x+y}); ==> ((1+2)+3)+4,

    if (Array.prototype.reduce === undefined) Array.prototype.reduce = function(fun) {
        if (this === void 0 || this === null) throw new TypeError()
        var t = Object(this),
            len = t.length >>> 0,
            k = 0,
            accumulator
        if (typeof fun != 'function') throw new TypeError()
        if (len == 0 && arguments.length == 1) throw new TypeError()
        //取初始值
        if (arguments.length >= 2) accumulator = arguments[1] //如果参数长度大于2个，则将第二个参数作为初始值
        else do {
            if (k in t) {
                accumulator = t[k++] //否则将数组的第一条数据作为初绍值
                break
            }
            if (++k >= len) throw new TypeError() //什么情况下会执行到这里来？？？
        } while (true)
        //遍历数组，将前一次的结果传入处理函数进行累计处理
        while (k < len) {
            if (k in t) accumulator = fun.call(undefined, accumulator, t[k], k, t)
            k++
        }
        return accumulator
    }

})()

var Zepto = (function() {
    var undefined, key, $, classList, emptyArray = [],
        slice = emptyArray.slice,
        filter = emptyArray.filter,
        document = window.document,
        elementDisplay = {}, classCache = {},
        getComputedStyle = document.defaultView.getComputedStyle,
    //设置CSS时，不用加px单位的属性
        cssNumber = {
            'column-count': 1,
            'columns': 1,
            'font-weight': 1,
            'line-height': 1,
            'opacity': 1,
            'z-index': 1,
            'zoom': 1
        },
    //HTML代码片断的正则
        fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    //匹配非单独一个闭合标签的标签，类似将<div></div>写成了<div/>
        tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    //根节点
        rootNodeRE = /^(?:body|html)$/i,

    //需要提供get和set的方法名
    // special attributes that should be get/set via method calls
        methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
    //相邻节点的一些操作
        adjacencyOperators = ['after', 'prepend', 'before', 'append'],
        table = document.createElement('table'),
        tableRow = document.createElement('tr'),
    //这里的用途是当需要给tr,tbody,thead,tfoot,td,th设置innerHTMl的时候，需要用其父元素作为容器来装载HTML字符串
        containers = {
            'tr': document.createElement('tbody'),
            'tbody': table,
            'thead': table,
            'tfoot': table,
            'td': tableRow,
            'th': tableRow,
            '*': document.createElement('div')
        },
    //当DOM ready的时候，document会有以下三种状态的一种
        readyRE = /complete|loaded|interactive/,
    //class选择器的正则
        classSelectorRE = /^\.([\w-]+)$/,
    //id选择器的正则
        idSelectorRE = /^#([\w-]*)$/,
    //DOM标签正则
        tagSelectorRE = /^[\w-]+$/,
        class2type = {},
        toString = class2type.toString,
        zepto = {},
        camelize, uniq,
        tempParent = document.createElement('div');

    //判断一个元素是否匹配给定的选择器
    zepto.matches = function(element, selector) {
        if (!element || element.nodeType !== 1) return false
        //引用浏览器提供的MatchesSelector方法
        var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector || element.oMatchesSelector || element.matchesSelector
        if (matchesSelector) return matchesSelector.call(element, selector);
        //如果浏览器不支持MatchesSelector方法，则将节点放入一个临时div节点，
        //再通过selector来查找这个div下的节点集，再判断给定的element是否在节点集中，如果在，则返回一个非零(即非false)的数字
        // fall back to performing a selector:
        var match, parent = element.parentNode,temp = !parent
        //当element没有父节点，那么将其插入到一个临时的div里面
        if (temp)(parent = tempParent).appendChild(element)
        //将parent作为上下文，来查找selector的匹配结果，并获取element在结果集的索引，不存在时为－1,再通过~-1转成0，存在时返回一个非零的值
        match = ~zepto.qsa(parent, selector).indexOf(element)
        //将插入的节点删掉
        temp && tempParent.removeChild(element)
        return match
    }

    //获取对象类型

    function type(obj) {
        //obj为null或者undefined时，直接返回'null'或'undefined'
        return obj == null ? String(obj) : class2type[toString.call(obj)] || "object"
    }

    function isFunction(value) {
        return type(value) == "function"
    }

    function isWindow(obj) {
        return obj != null && obj == obj.window
    }

    function isDocument(obj) {
        return obj != null && obj.nodeType == obj.DOCUMENT_NODE
    }

    function isObject(obj) {
        return type(obj) == "object"
    }
    //对于通过字面量定义的对象和new Object的对象返回true，new Object时传参数的返回false
    //可参考http://snandy.iteye.com/blog/663245

    function isPlainObject(obj) {
        return isObject(obj) && !isWindow(obj) && obj.__proto__ == Object.prototype
    }

    function isArray(value) {
        return value instanceof Array
    }
    //类数组，比如nodeList，这个只是做最简单的判断，如果给一个对象定义一个值为数据的length属性，它同样会返回true

    function likeArray(obj) {
        return typeof obj.length == 'number'
    }

    //清除给定的参数中的null或undefined，注意0==null,'' == null为false

    function compact(array) {
        return filter.call(array, function(item) {
            return item != null
        })
    }
    //类似得到一个数组的副本

    function flatten(array) {
        return array.length > 0 ? $.fn.concat.apply([], array) : array
    }
    //将字符串转成驼峰式的格式
    camelize = function(str) {
        return str.replace(/-+(.)?/g, function(match, chr) {
            return chr ? chr.toUpperCase() : ''
        })
    }
    //将字符串格式化成-拼接的形式,一般用在样式属性上，比如border-width

    function dasherize(str) {
        return str.replace(/::/g, '/') //将：：替换成/
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') //在大小写字符之间插入_,大写在前，比如AAAbb,得到AA_Abb
            .replace(/([a-z\d])([A-Z])/g, '$1_$2') //在大小写字符之间插入_,小写或数字在前，比如bbbAaa,得到bbb_Aaa
            .replace(/_/g, '-') //将_替换成-
            .toLowerCase() //转成小写
    }
    //数组去重，如果该条数据在数组中的位置与循环的索引值不相同，则说明数组中有与其相同的值
    uniq = function(array) {
        return filter.call(array, function(item, idx) {
            return array.indexOf(item) == idx
        })
    }

    //将给定的参数生成正则

    function classRE(name) {
        //classCache,缓存正则
        return name in classCache ? classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
    }
    //给需要的样式值后面加上'px'单位，除了cssNumber里面的指定的那些

    function maybeAddPx(name, value) {
        return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
    }
    //获取节点的默认display属性

    function defaultDisplay(nodeName) {
        var element, display
        if (!elementDisplay[nodeName]) { //缓存里不存在
            element = document.createElement(nodeName)
            document.body.appendChild(element)
            display = getComputedStyle(element, '').getPropertyValue("display")
            element.parentNode.removeChild(element)
            display == "none" && (display = "block") //当display等于none时，设置其值为block,搞不懂为毛要这样
            elementDisplay[nodeName] = display //缓存元素的默认display属性
        }
        return elementDisplay[nodeName]
    }
    //获取指定元素的子节点(不包含文本节点),Firefox不支持children，所以只能通过筛选childNodes

    function children(element) {
        return 'children' in element ? slice.call(element.children) : $.map(element.childNodes, function(node) {
            if (node.nodeType == 1) return node
        })
    }

    // `$.zepto.fragment` takes a html string and an optional tag name
    // to generate DOM nodes nodes from the given html string.
    // The generated DOM nodes are returned as an array.
    // This function can be overriden in plugins for example to make
    // it compatible with browsers that don't support the DOM fully.
    zepto.fragment = function(html, name, properties) {
        //将类似<div class="test"/>替换成<div class="test"></div>,算是一种修复吧
        if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
        //给name取标签名
        if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
        //设置容器标签名，如果不是tr,tbody,thead,tfoot,td,th，则容器标签名为div
        if (!(name in containers)) name = '*'

        var nodes, dom, container = containers[name] //创建容器
        container.innerHTML = '' + html //将html代码片断放入容器
        //取容器的子节点，这样就直接把字符串转成DOM节点了
        dom = $.each(slice.call(container.childNodes), function() {
            container.removeChild(this) //逐个删除
        })
        //如果properties是对象, 则将其当作属性来给添加进来的节点进行设置
        if (isPlainObject(properties)) {
            nodes = $(dom) //将dom转成zepto对象，为了方便下面调用zepto上的方法
            //遍历对象，设置属性
            $.each(properties, function(key, value) {
                //如果设置的是'val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'，则调用zepto上相对应的方法
                if (methodAttributes.indexOf(key) > -1) nodes[key](value)
                else nodes.attr(key, value)
            })
        }
        //返回将字符串转成的DOM节点后的数组，比如'<li></li><li></li><li></li>'转成[li,li,li]
        return dom
    }

    // `$.zepto.Z` swaps out the prototype of the given `dom` array
    // of nodes with `$.fn` and thus supplying all the Zepto functions
    // to the array. Note that `__proto__` is not supported on Internet
    // Explorer. This method can be overriden in plugins.
    zepto.Z = function(dom, selector) {
        dom = dom || []
        dom.__proto__ = $.fn //通过给dom设置__proto__属性指向$.fn来达到继承$.fn上所有方法的目的
        dom.selector = selector || ''
        return dom
    }

    // `$.zepto.isZ` should return `true` if the given object is a Zepto
    // collection. This method can be overriden in plugins.
    //判断给定的参数是否是Zepto集
    zepto.isZ = function(object) {
        return object instanceof zepto.Z
    }

    // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
    // takes a CSS selector and an optional context (and handles various
    // special cases).
    // This method can be overriden in plugins.
    zepto.init = function(selector, context) {
        // If nothing given, return an empty Zepto collection
        if (!selector) return zepto.Z() //没有参数，返回空数组
        //如果selector是个函数，则在DOM ready的时候执行它
        else if (isFunction(selector)) return $(document).ready(selector)
        //如果selector是一个zepto.Z实例，则直接返回它自己
        else if (zepto.isZ(selector)) return selector
        else {
            var dom
            //如果selector是一个数组，则将其里面的null,undefined去掉
            if (isArray(selector)) dom = compact(selector)
            //如果selector是个对象，注意DOM节点的typeof值也是object，所以在里面还要再进行一次判断
            else if (isObject(selector))
            //如果是申明的对象，如{}， 则将selector属性copy到一个新对象，并将结果放入数组
            //如果是该对象是DOM，则直接放到数组中
                dom = [isPlainObject(selector) ? $.extend({}, selector) : selector], selector = null
            //如果selector是一段HTML代码片断，则将其转换成DOM节点
            else if (fragmentRE.test(selector)) dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
            //如果存在上下文context，则在上下文中查找selector，此时的selector为普通的CSS选择器
            else if (context !== undefined) return $(context).find(selector)
            //如果没有给定上下文，则在document中查找selector，此时的selector为普通的CSS选择器
            else dom = zepto.qsa(document, selector)
            //最后将查询结果转换成zepto集合
            return zepto.Z(dom, selector)
        }
    }

    // `$` will be the base `Zepto` object. When calling this
    // function just call `$.zepto.init, which makes the implementation
    // details of selecting nodes and creating Zepto collections
    // patchable in plugins.
    $ = function(selector, context) {
        return zepto.init(selector, context)
    }

    //扩展，deep表示是否深度扩展

    function extend(target, source, deep) {
        for (key in source)
            //如果深度扩展
            if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
                //如果要扩展的数据是对象且target相对应的key不是对象
                if (isPlainObject(source[key]) && !isPlainObject(target[key])) target[key] = {}
                //如果要扩展的数据是数组且target相对应的key不是数组
                if (isArray(source[key]) && !isArray(target[key])) target[key] = []
                extend(target[key], source[key], deep)
            } else if (source[key] !== undefined) target[key] = source[key]
    }

    // Copy all but undefined properties from one or more
    // objects to the `target` object.
    $.extend = function(target) {
        var deep, args = slice.call(arguments, 1)
        if (typeof target == 'boolean') { //当第一个参数为boolean类型的值时，表示是否深度扩展
            deep = target
            target = args.shift() //target取第二个参数
        }
        //遍历后面的参数，全部扩展到target上
        args.forEach(function(arg) {
            extend(target, arg, deep)
        })
        return target
    }

    // `$.zepto.qsa` is Zepto's CSS selector implementation which
    // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
    // This method can be overriden in plugins.
    zepto.qsa = function(element, selector) {
        var found
        //当element为document,且selector为ID选择器时
        return (isDocument(element) && idSelectorRE.test(selector)) ?
            //直接返回document.getElementById,RegExp.$1为ID的值,当没有找节点时返回[]
            ((found = element.getElementById(RegExp.$1)) ? [found] : []) :
            //当element不为元素节点或者document时，返回[]
            (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
                //否则将获取到的结果转成数组并返回
                slice.call(
                    //如果selector是标签名,直接调用getElementsByClassName
                    classSelectorRE.test(selector) ? element.getElementsByClassName(RegExp.$1) :
                        //如果selector是标签名,直接调用getElementsByTagName
                        tagSelectorRE.test(selector) ? element.getElementsByTagName(selector) :
                            //否则调用querySelectorAll
                            element.querySelectorAll(selector))
    }

    //在结果中进行过滤

    function filtered(nodes, selector) {
        return selector === undefined ? $(nodes) : $(nodes).filter(selector)
    }
    //判断parent是否包含node
    $.contains = function(parent, node) {
        return parent !== node && parent.contains(node)
    }

    //这个函数在整个库中取着很得要的作用，处理arg为函数或者值的情况
    //下面很多设置元素属性时的函数都有用到

    function funcArg(context, arg, idx, payload) {
        return isFunction(arg) ? arg.call(context, idx, payload) : arg
    }

    function setAttribute(node, name, value) {
        //如果设置的值为null或undefined,则相当于删除该属性，否则设置name属性为value
        value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
    }

    // access className property while respecting SVGAnimatedString

    function className(node, value) {
        var klass = node.className,
            svg = klass && klass.baseVal !== undefined

        if (value === undefined) return svg ? klass.baseVal : klass
        svg ? (klass.baseVal = value) : (node.className = value)
    }

    // "true"  => true
    // "false" => false
    // "null"  => null
    // "42"    => 42
    // "42.5"  => 42.5
    // JSON    => parse if valid
    // String  => self

    function deserializeValue(value) {
        var num
        try {
            return value ? value == "true" || (value == "false" ? false : value == "null" ? null : !isNaN(num = Number(value)) ? num : /^[\[\{]/.test(value) ? $.parseJSON(value) : value) : value
        } catch (e) {
            return value
        }
    }

    $.type = type
    $.isFunction = isFunction
    $.isWindow = isWindow
    $.isArray = isArray
    $.isPlainObject = isPlainObject

    //空对象
    $.isEmptyObject = function(obj) {
        var name
        for (name in obj) return false
        return true
    }

    //获取指定的值在数组中的位置
    $.inArray = function(elem, array, i) {
        return emptyArray.indexOf.call(array, elem, i)
    }
    //将字符串转成驼峰式的格式
    $.camelCase = camelize
    //去字符串头尾空格
    $.trim = function(str) {
        return str.trim()
    }

    // plugin compatibility
    $.uuid = 0
    $.support = {}
    $.expr = {}

    //遍历elements，将每条记录放入callback里进宪处理，保存处理函数返回值不为null或undefined的结果
    //注意这里没有统一的用for in,是为了避免遍历数据默认属性的情况，如数组的toString,valueOf
    $.map = function(elements, callback) {
        var value, values = [],
            i, key
        //如果被遍历的数据是数组或者nodeList
        if (likeArray(elements)) for (i = 0; i < elements.length; i++) {
            value = callback(elements[i], i)
            if (value != null) values.push(value)
        } else
        //如果是对象
            for (key in elements) {
                value = callback(elements[key], key)
                if (value != null) values.push(value)
            }
        return flatten(values)
    }

    //遍历数组，将每条数据作为callback的上下文，并传入数据以及数据的索引进行处理，如果其中一条数据的处理结果明确返回false，
    //则停止遍历，并返回elements
    $.each = function(elements, callback) {
        var i, key
        if (likeArray(elements)) {
            for (i = 0; i < elements.length; i++)
                if (callback.call(elements[i], i, elements[i]) === false) return elements
        } else {
            for (key in elements)
                if (callback.call(elements[key], key, elements[key]) === false) return elements
        }

        return elements
    }
    //过滤
    $.grep = function(elements, callback) {
        return filter.call(elements, callback)
    }

    if (window.JSON) $.parseJSON = JSON.parse

    // Populate the class2type map
    //填充class2type的值
    $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
        class2type["[object " + name + "]"] = name.toLowerCase()
    })

    //针对DOM的一些操作
    // Define methods that will be available on all
    // Zepto collections
    $.fn = {
        // Because a collection acts like an array
        // copy over these useful array functions.
        forEach: emptyArray.forEach,
        reduce: emptyArray.reduce,
        push: emptyArray.push,
        sort: emptyArray.sort,
        indexOf: emptyArray.indexOf,
        concat: emptyArray.concat,

        // `map` and `slice` in the jQuery API work differently
        // from their array counterparts
        map: function(fn) {
            return $($.map(this, function(el, i) {
                return fn.call(el, i, el)
            }))
        },
        slice: function() {
            return $(slice.apply(this, arguments))
        },
        //DOM Ready
        ready: function(callback, jumpHostAppInject) {
            var originCb = callback;
            var mcounter = 0;
            //尝试等待(1500ms超时)让壳注入HostApp Js
            callback = function () {
                if(!window.HostApp && mcounter++ < 150)setTimeout(callback, 10);else originCb($);
            };
            //是否跳过等待HostApp的注入
            if (jumpHostAppInject) {
                callback = originCb;
            }
            if (readyRE.test(document.readyState)) callback($); else document.addEventListener('DOMContentLoaded', function() {
                    callback($)
                }, false);
            return this
        },
        //取集合中对应指定索引的值，如果idx小于0,则idx等于idx+length,length为集合的长度
        get: function(idx) {
            return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
        },
        //将集合转换为数组
        toArray: function() {
            return this.get()
        },
        //获取集合长度
        size: function() {
            return this.length
        },
        //将集合从dom中删除
        remove: function() {
            return this.each(function() {
                if (this.parentNode != null) this.parentNode.removeChild(this)
            })
        },
        //遍历集合，将集合中的每一项放入callback中进行处理，去掉结果为false的项，注意这里的callback如果明确返回false
        //那么就会停止循环了
        each: function(callback) {
            emptyArray.every.call(this, function(el, idx) {
                return callback.call(el, idx, el) !== false
            })
            return this
        },
        //过滤集合，返回处理结果为true的记录
        filter: function(selector) {
            //this.not(selector)取到需要排除的集合，第二次再取反(这个时候this.not的参数就是一个集合了)，得到想要的集合
            if (isFunction(selector)) return this.not(this.not(selector))
            //filter收集返回结果为true的记录
            return $(filter.call(this, function(element) {
                return zepto.matches(element, selector) //当element与selector匹配，则收集
            }))
        },
        //将由selector获取到的结果追加到当前集合中
        add: function(selector, context) {
            return $(uniq(this.concat($(selector, context)))) //追加并去重
        },
        //返回集合中的第1条记录是否与selector匹配
        is: function(selector) {
            return this.length > 0 && zepto.matches(this[0], selector)
        },
        //排除集合里满足条件的记录，接收参数为：css选择器，function, dom ,nodeList
        not: function(selector) {
            var nodes = []
            //当selector为函数时，safari下的typeof odeList也是function，所以这里需要再加一个判断selector.call !== undefined
            if (isFunction(selector) && selector.call !== undefined) {
                this.each(function(idx) {
                    //注意这里收集的是selector.call(this,idx)返回结果为false的时候记录
                    if (!selector.call(this, idx)) nodes.push(this)
                })
            } else {
                //当selector为字符串的时候，对集合进行筛选，也就是筛选出集合中满足selector的记录
                var excludes = typeof selector == 'string' ? this.filter(selector) :
                    //当selector为nodeList时执行slice.call(selector),注意这里的isFunction(selector.item)是为了排除selector为数组的情况
                    //当selector为css选择器，执行$(selector)
                    (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
                this.forEach(function(el) {
                    //筛选出不在excludes集合里的记录，达到排除的目的
                    if (excludes.indexOf(el) < 0) nodes.push(el)
                })
            }
            return $(nodes) //由于上面得到的结果是数组，这里需要转成zepto对象，以便继承其它方法，实现链写
        },
        /*
         接收node和string作为参数，给当前集合筛选出包含selector的集合
         isObject(selector)是判断参数是否是node，因为typeof node == 'object'
         当参数为node时，只需要判读当前记当里是否包含node节点即可
         当参数为string时，则在当前记录里查询selector，如果长度为0，则为false，filter函数就会过滤掉这条记录，否则保存该记录
         */
        has: function(selector) {
            return this.filter(function() {
                return isObject(selector) ? $.contains(this, selector) : $(this).find(selector).size()
            })
        },
        /*
         选择集合中指定索引的记录，当idx为-1时，取最后一个记录
         */
        eq: function(idx) {
            return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1)
        },
        /*
         取集合中的第一条记录
         */
        first: function() {
            var el = this[0] //取集合中的第一条记录
            //如果集合中的第一条数据本身就已经是zepto对象则直接返回本身，否则转成zepto对象
            //el && !isObject(el)在这里取到一个判断el是否为节点的情况，因为如果el是节点，那么isObject(el)的结果就是true
            return el && !isObject(el) ? el : $(el)
        },
        /*
         取集合中的最后一条记录
         */
        last: function() {
            var el = this[this.length - 1] //取集合中的最后一条记录
            //如果el为node,则isObject(el)会为true,需要转成zepto对象
            return el && !isObject(el) ? el : $(el)
        },
        /*
         在当前集合中查找selector，selector可以是集合，选择器，以及节点
         */
        find: function(selector) {
            var result, $this = this
            //如果selector为node或者zepto集合时
            if (typeof selector == 'object')
            //遍历selector，筛选出父级为集合中记录的selector
                result = $(selector).filter(function() {
                    var node = this
                    //如果$.contains(parent, node)返回true，则emptyArray.some也会返回true,外层的filter则会收录该条记录
                    return emptyArray.some.call($this, function(parent) {
                        return $.contains(parent, node)
                    })
                })
            //如果selector是css选择器
            //如果当前集合长度为1时，调用zepto.qsa，将结果转成zepto对象
            else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
            //如果长度大于1，则调用map遍历
            else result = this.map(function() {
                    return zepto.qsa(this, selector)
                })
            return result
        },
        //取集合中第一记录的最近的满足条件的父级元素
        closest: function(selector, context) {
            var node = this[0],
                collection = false
            if (typeof selector == 'object') collection = $(selector)
            //当selector是node或者zepto集合时，如果node不在collection集合中时需要取node.parentNode进行判断
            //当selector是字符串选择器时，如果node与selector不匹配，则需要取node.parentNode进行判断
            while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
                //当node 不是context,document的时候，取node.parentNode
                node = node !== context && !isDocument(node) && node.parentNode
            return $(node)
        },
        //取集合所有父级元素
        parents: function(selector) {
            var ancestors = [],
                nodes = this
            //通过遍历nodes得到所有父级，注意在while里nodes被重新赋值了
            //本函数的巧妙之处在于，不停在获取父级，再遍历父级获取父级的父级
            //然后再通过去重，得到最终想要的结果，当到达最顶层的父级时，nodes.length就为0了
            while (nodes.length > 0)
                //nodes被重新赋值为收集到的父级集合
                nodes = $.map(nodes, function(node) {
                    //遍历nodes，收集集合的第一层父级
                    //ancestors.indexOf(node) < 0用来去重复
                    if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
                        ancestors.push(node) //收集已经获取到的父级元素，用于去重复
                        return node
                    }
                })
            //上面还只是取到了所有的父级元素，这里还需要对其进行筛选从而得到最终想要的结果
            return filtered(ancestors, selector)
        },
        //获取集合的父节点
        parent: function(selector) {
            return filtered(uniq(this.pluck('parentNode')), selector)
        },
        children: function(selector) {
            return filtered(this.map(function() {
                return children(this)
            }), selector)
        },
        contents: function() {
            return this.map(function() {
                return slice.call(this.childNodes)
            })
        },
        siblings: function(selector) {
            return filtered(this.map(function(i, el) {
                //先获取该节点的父节点中的所有子节点，再排除本身
                return filter.call(children(el.parentNode), function(child) {
                    return child !== el
                })
            }), selector)
        },
        empty: function() {
            return this.each(function() {
                this.innerHTML = ''
            })
        },
        //根据属性来获取当前集合的相关集合
        pluck: function(property) {
            return $.map(this, function(el) {
                return el[property]
            })
        },
        show: function() {
            return this.each(function() {
                //清除元素的内联display="none"的样式
                this.style.display == "none" && (this.style.display = null)
                //当样式表里的该元素的display样式为none时，设置它的display为默认值
                if (getComputedStyle(this, '').getPropertyValue("display") == "none") this.style.display = defaultDisplay(this.nodeName) //defaultDisplay是获取元素默认display的方法
            })
        },
        replaceWith: function(newContent) {
            //将要替换的内容插入到被替换的内容前面，然后删除被替换的内容
            return this.before(newContent).remove()
        },
        wrap: function(structure) {
            var func = isFunction(structure)
            if (this[0] && !func)
            //如果structure是字符串，则将其转成DOM
                var dom = $(structure).get(0),
                //如果structure是已经存在于页面上的节点或者被wrap的记录不只一条，则需要clone dom
                    clone = dom.parentNode || this.length > 1

            return this.each(function(index) {
                $(this).wrapAll(
                    func ? structure.call(this, index) : clone ? dom.cloneNode(true) : dom)
            })
        },
        wrapAll: function(structure) {
            if (this[0]) {
                //将要包裹的内容插入到第一条记录的前面，算是给structure定位围置
                $(this[0]).before(structure = $(structure))
                var children
                // drill down to the inmost element
                //取structure里的第一个子节点的最里层
                while ((children = structure.children()).length) structure = children.first()
                //将当前集合插入到最里层的节点里，达到wrapAll的目的
                $(structure).append(this)
            }
            return this
        },
        //在匹配元素里的内容外包一层结构
        wrapInner: function(structure) {
            var func = isFunction(structure)
            return this.each(function(index) {
                //原理就是获取节点的内容，然后用structure将内容包起来，如果内容不存在，则直接将structure append到该节点
                var self = $(this),
                    contents = self.contents(),
                    dom = func ? structure.call(this, index) : structure
                contents.length ? contents.wrapAll(dom) : self.append(dom)
            })
        },
        unwrap: function() {
            //用子元素替换掉父级
            this.parent().each(function() {
                $(this).replaceWith($(this).children())
            })
            return this
        },
        //clone node
        clone: function() {
            return this.map(function() {
                return this.cloneNode(true)
            })
        },
        //隐藏集合
        hide: function() {
            return this.css("display", "none")
        },
        toggle: function(setting) {
            return this.each(function() {
                var el = $(this);
                /*
                 这个setting取得作用就是控制显示与隐藏，并不切换，当它的值为true时，一直显示，false时，一直隐藏
                 这个地方的判断看上去有点绕，其实也简单，意思是说，当不给toogle参数时，根据元素的display是否等于none来决定显示或者隐藏元素
                 当给toogle参数，就没有切换效果了，只是简单的根据参数值来决定显示或隐藏。如果参数true,相当于show方法，false则相当于hide方法
                 */
                (setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
            })
        },
        prev: function(selector) {
            return $(this.pluck('previousElementSibling')).filter(selector || '*')
        },
        next: function(selector) {
            return $(this.pluck('nextElementSibling')).filter(selector || '*')
        },
        //当有参数时，设置集合每条记录的HTML，没有参数时，则为获取集合第一条记录的HTML，如果集合的长度为0,则返回null
        html: function(html) {
            return html === undefined ?
                //参数html不存在时，获取集合中第一条记录的html
                (this.length > 0 ? this[0].innerHTML : null) :
                //否则遍历集合，设置每条记录的html
                this.each(function(idx) {
                    //记录原始的innerHTMl
                    var originHtml = this.innerHTML
                    //如果参数html是字符串直接插入到记录中，
                    //如果是函数，则将当前记录作为上下文，调用该函数，且传入该记录的索引和原始innerHTML作为参数
                    $(this).empty().append(funcArg(this, html, idx, originHtml))
                })
        },
        text: function(text) {
            //如果不给定text参数，则为获取功能，集合长度大于0时，取第一条数据的textContent，否则返回null,
            //如果给定text参数，则为集合的每一条数据设置textContent为text
            return text === undefined ? (this.length > 0 ? this[0].textContent : null) : this.each(function() {
                this.textContent = text
            })
        },
        attr: function(name, value) {
            var result
            //当只有name且为字符串时，表示获取第一条记录的属性
            return (typeof name == 'string' && value === undefined) ?
                //集合没有记录或者集合的元素不是node类型，返回undefined
                (this.length == 0 || this[0].nodeType !== 1 ? undefined :
                    //如果取的是input的value
                    (name == 'value' && this[0].nodeName == 'INPUT') ? this.val() :
                        //注意直接定义在node上的属性，在标准浏览器和ie9,10中用getAttribute取不到,得到的结果是null
                        //比如div.aa = 10,用div.getAttribute('aa')得到的是null,需要用div.aa或者div['aa']这样来取
                        (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result) :
                this.each(function(idx) {
                    if (this.nodeType !== 1) return
                    //如果name是一个对象，如{'id':'test','value':11},则给数据设置属性
                    if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
                    //如果name只是一个普通的属性字符串，用funcArg来处理value是值或者function的情况最终返回一个属性值
                    //如果funcArg函数返回的是undefined或者null，则相当于删除元素的属性
                    else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
                })
        },
        removeAttr: function(name) {
            return this.each(function() {
                this.nodeType === 1 && setAttribute(this, name)//setAttribute的第三个参数为null时，效果是删除name属性
            })
        },
        //获取第一条数据的指定的name属性或者给每条数据添加自定义属性，注意和setAttribute的区别
        prop: function(name, value) {
            //没有给定value时，为获取，给定value则给每一条数据添加，value可以为值也可以是一个返回值的函数
            return (value === undefined) ? (this[0] && this[0][name]) : this.each(function(idx) {
                this[name] = funcArg(this, value, idx, this[name])
            })
        },
        data: function(name, value) {
            //通过调用attr方法来实现获取与设置的效果，注意attr方法里，当value存在的时候，返回的是集合本身，如果不存在，则是返回获取的值
            var data = this.attr('data-' + dasherize(name), value)
            return data !== null ? deserializeValue(data) : undefined
        },
        val: function(value) {
            return (value === undefined) ?
                //如果是多选的select，则返回一个包含被选中的option的值的数组
                (this[0] && (this[0].multiple ? $(this[0]).find('option').filter(function(o) {
                    return this.selected
                }).pluck('value') : this[0].value)) : this.each(function(idx) {
                this.value = funcArg(this, value, idx, this.value)
            })
        },
        offset: function(coordinates) {
            if (coordinates) return this.each(function(index) {
                var $this = $(this),
                //coordinates为{}时直接返回，为函数时返回处理结果给coords
                    coords = funcArg(this, coordinates, index, $this.offset()),
                //取父级的offset
                    parentOffset = $this.offsetParent().offset(),
                //计算出它们之间的差，得出其偏移量
                    props = {
                        top: coords.top - parentOffset.top,
                        left: coords.left - parentOffset.left
                    }
                //注意元素的position为static时，设置top,left是无效的
                if ($this.css('position') == 'static') props['position'] = 'relative'
                $this.css(props)
            })
            //取第一条记录的offset,包括offsetTop,offsetLeft,offsetWidth,offsetHeight
            if (this.length == 0) return null
            var obj = this[0].getBoundingClientRect()
            //window.pageYOffset就是类似Math.max(document.documentElement.scrollTop||document.body.scrollTop)
            return {
                left: obj.left + window.pageXOffset,
                top: obj.top + window.pageYOffset,
                width: Math.round(obj.width),
                height: Math.round(obj.height)
            }
        },
        css: function(property, value) {
            //获取指定的样式
            if (arguments.length < 2 && typeof property == 'string') return this[0] && (this[0].style[camelize(property)] || getComputedStyle(this[0], '').getPropertyValue(property))
            //设置样式
            var css = ''
            if (type(property) == 'string') {
                if (!value && value !== 0) //当value的值为非零的可以转成false的值时如(null,undefined)，删掉property样式
                    this.each(function() {
                        //style.removeProperty 移除指定的CSS样式名(IE不支持DOM的style方法)
                        this.style.removeProperty(dasherize(property))
                    })
                else css = dasherize(property) + ":" + maybeAddPx(property, value)
            } else {
                //当property是对象时
                for (key in property)
                    if (!property[key] && property[key] !== 0)
                    //当property[key]的值为非零的可以转成false的值时，删掉key样式
                        this.each(function() {
                            this.style.removeProperty(dasherize(key))
                        })
                    else css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
            }
            //设置
            return this.each(function() {
                this.style.cssText += ';' + css
            })
        },
        index: function(element) {
            //这里的$(element)[0]是为了将字符串转成node,因为this是个包含node的数组
            //当不指定element时，取集合中第一条记录在其父节点的位置
            //this.parent().children().indexOf(this[0])这句很巧妙，和取第一记录的parent().children().indexOf(this)相同
            return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
        },
        hasClass: function(name) {
            return emptyArray.some.call(this, function(el) {
                //注意这里的this是classRE(name)生成的正则
                return this.test(className(el))
            }, classRE(name))
        },
        addClass: function(name) {
            return this.each(function(idx) {
                classList = []
                var cls = className(this),
                    newName = funcArg(this, name, idx, cls)
                //处理同时多个类的情况，用空格分开
                newName.split(/\s+/g).forEach(function(klass) {
                    if (!$(this).hasClass(klass)) classList.push(klass)
                }, this)
                classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
            })
        },
        removeClass: function(name) {
            return this.each(function(idx) {
                if (name === undefined) return className(this, '')
                classList = className(this)
                funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass) {
                    classList = classList.replace(classRE(klass), " ")
                })
                className(this, classList.trim())
            })
        },
        toggleClass: function(name, when) {
            return this.each(function(idx) {
                var $this = $(this),
                    names = funcArg(this, name, idx, className(this))
                names.split(/\s+/g).forEach(function(klass) {
                    (when === undefined ? !$this.hasClass(klass) : when) ? $this.addClass(klass) : $this.removeClass(klass)
                })
            })
        },
        scrollTop: function() {
            if (!this.length) return
            return ('scrollTop' in this[0]) ? this[0].scrollTop : this[0].scrollY
        },
        position: function() {
            if (!this.length) return

            var elem = this[0],
            // Get *real* offsetParent
                offsetParent = this.offsetParent(),
            // Get correct offsets
                offset = this.offset(),
                parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? {
                    top: 0,
                    left: 0
                } : offsetParent.offset()

            // Subtract element margins
            // note: when an element has margin: auto the offsetLeft and marginLeft
            // are the same in Safari causing offset.left to incorrectly be 0
            offset.top -= parseFloat($(elem).css('margin-top')) || 0
            offset.left -= parseFloat($(elem).css('margin-left')) || 0

            // Add offsetParent borders
            parentOffset.top += parseFloat($(offsetParent[0]).css('border-top-width')) || 0
            parentOffset.left += parseFloat($(offsetParent[0]).css('border-left-width')) || 0

            // Subtract the two offsets
            return {
                top: offset.top - parentOffset.top,
                left: offset.left - parentOffset.left
            }
        },
        offsetParent: function() {
            return this.map(function() {
                var parent = this.offsetParent || document.body
                while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
                    parent = parent.offsetParent
                return parent
            })
        }
    }

    // for now
    $.fn.detach = $.fn.remove

        // Generate the `width` and `height` functions
    ;
    ['width', 'height'].forEach(function(dimension) {
        $.fn[dimension] = function(value) {
            var offset, el = this[0],
            //将width,hegiht转成Width,Height，用于取window或者document的width和height
                Dimension = dimension.replace(/./, function(m) {
                    return m[0].toUpperCase()
                })
            //没有参数为获取，获取window的width和height用innerWidth,innerHeight
            if (value === undefined) return isWindow(el) ? el['inner' + Dimension] :
                //获取document的width和height时，用offsetWidth,offsetHeight
                isDocument(el) ? el.documentElement['offset' + Dimension] : (offset = this.offset()) && offset[dimension]
            else return this.each(function(idx) {
                el = $(this)
                el.css(dimension, funcArg(this, value, idx, el[dimension]()))
            })
        }
    })

    function traverseNode(node, fun) {
        fun(node)
        for (var key in node.childNodes) traverseNode(node.childNodes[key], fun)
    }

    // Generate the `after`, `prepend`, `before`, `append`,
    // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
    adjacencyOperators.forEach(function(operator, operatorIndex) {
        var inside = operatorIndex % 2 //=> prepend, append

        $.fn[operator] = function() {
            // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
            var argType, nodes = $.map(arguments, function(arg) {
                    argType = type(arg)
                    return argType == "object" || argType == "array" || arg == null ? arg : zepto.fragment(arg)
                }),
                parent, copyByClone = this.length > 1 //如果集合的长度大于集，则需要clone被插入的节点
            if (nodes.length < 1) return this

            return this.each(function(_, target) {
                parent = inside ? target : target.parentNode

                //通过改变target将after，prepend，append操作转成before操作，insertBefore的第二个参数为null时等于appendChild操作
                target = operatorIndex == 0 ? target.nextSibling : operatorIndex == 1 ? target.firstChild : operatorIndex == 2 ? target : null

                nodes.forEach(function(node) {
                    if (copyByClone) node = node.cloneNode(true)
                    else if (!parent) return $(node).remove()

                    //插入节点后，如果被插入的节点是SCRIPT，则执行里面的内容并将window设为上下文
                    traverseNode(parent.insertBefore(node, target), function(el) {
                        if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' && (!el.type || el.type === 'text/javascript') && !el.src) window['eval'].call(window, el.innerHTML)
                    })
                })
            })
        }

        // after    => insertAfter
        // prepend  => prependTo
        // before   => insertBefore
        // append   => appendTo
        $.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function(html) {
            $(html)[operator](this)
            return this
        }
    })

    zepto.Z.prototype = $.fn

    // Export internal API functions in the `$.zepto` namespace
    zepto.uniq = uniq
    zepto.deserializeValue = deserializeValue
    $.zepto = zepto

    return $
})();

window.Zepto = Zepto;
'$' in window || (window.$ = Zepto);

;(function($) {
    function detect(ua) {
        var os = this.os = {}, browser = this.browser = {},
            webkit = ua.match(/WebKit\/([\d.]+)/),
            android = ua.match(/(Android)\s+([\d.]+)/),
            ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
            iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
            webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
            touchpad = webos && ua.match(/TouchPad/),
            kindle = ua.match(/Kindle\/([\d.]+)/),
            silk = ua.match(/Silk\/([\d._]+)/),
            blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/),
            bb10 = ua.match(/(BB10).*Version\/([\d.]+)/),
            rimtabletos = ua.match(/(RIM\sTablet\sOS)\s([\d.]+)/),
            playbook = ua.match(/PlayBook/),
            chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
            firefox = ua.match(/Firefox\/([\d.]+)/)

        // Todo: clean this up with a better OS/browser seperation:
        // - discern (more) between multiple browsers on android
        // - decide if kindle fire in silk mode is android or not
        // - Firefox on Android doesn't specify the Android version
        // - possibly devide in os, device and browser hashes

        if (browser.webkit = !! webkit) browser.version = webkit[1]

        if (android) os.android = true, os.version = android[2]
        if (iphone) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.')
        if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.')
        if (webos) os.webos = true, os.version = webos[2]
        if (touchpad) os.touchpad = true
        if (blackberry) os.blackberry = true, os.version = blackberry[2]
        if (bb10) os.bb10 = true, os.version = bb10[2]
        if (rimtabletos) os.rimtabletos = true, os.version = rimtabletos[2]
        if (playbook) browser.playbook = true
        if (kindle) os.kindle = true, os.version = kindle[1]
        if (silk) browser.silk = true, browser.version = silk[1]
        if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true
        if (chrome) browser.chrome = true, browser.version = chrome[1]
        if (firefox) browser.firefox = true, browser.version = firefox[1]

        os.tablet = !! (ipad || playbook || (android && !ua.match(/Mobile/)) || (firefox && ua.match(/Tablet/)))
        os.phone = !! (!os.tablet && (android || iphone || webos || blackberry || bb10 || (chrome && ua.match(/Android/)) || (chrome && ua.match(/CriOS\/([\d.]+)/)) || (firefox && ua.match(/Mobile/))))
    }

    detect.call($, navigator.userAgent)
    // make available to unit tests
    $.__detect = detect

})(Zepto)

    /*
     事件处理部份
     */
;
(function($) {
    var $$ = $.zepto.qsa,
        handlers = {}, _zid = 1,
        specialEvents = {},
        hover = {
            mouseenter: 'mouseover',
            mouseleave: 'mouseout'
        }

    specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

    //取element的唯一标示符，如果没有，则设置一个并返回

    function zid(element) {
        return element._zid || (element._zid = _zid++)
    }
    //查找绑定在元素上的指定类型的事件处理函数集合

    function findHandlers(element, event, fn, selector) {
        event = parse(event)
        if (event.ns) var matcher = matcherFor(event.ns)
        return (handlers[zid(element)] || []).filter(function(handler) {
            return handler && (!event.e || handler.e == event.e) //判断事件类型是否相同
                &&
                (!event.ns || matcher.test(handler.ns)) //判断事件命名空间是否相同
                //注意函数是引用类型的数据zid(handler.fn)的作用是返回handler.fn的标示符，如果没有，则给它添加一个，
                //这样如果fn和handler.fn引用的是同一个函数，那么fn上应该也可相同的标示符，
                //这里就是通过这一点来判断两个变量是否引用的同一个函数
                &&
                (!fn || zid(handler.fn) === zid(fn)) && (!selector || handler.sel == selector)
        })
    }
    //解析事件类型，返回一个包含事件名称和事件命名空间的对象

    function parse(event) {
        var parts = ('' + event).split('.')
        return {
            e: parts[0],
            ns: parts.slice(1).sort().join(' ')
        }
    }
    //生成命名空间的正则

    function matcherFor(ns) {
        return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
    }
    //遍历events

    function eachEvent(events, fn, iterator) {
        if ($.type(events) != "string") $.each(events, iterator)
        else events.split(/\s/).forEach(function(type) {
            iterator(type, fn)
        })
    }
    //通过给focus和blur事件设置为捕获来达到事件冒泡的目的

    function eventCapture(handler, captureSetting) {
        return handler.del && (handler.e == 'focus' || handler.e == 'blur') || !! captureSetting
    }

    //修复不支持mouseenter和mouseleave的情况

    function realEvent(type) {
        return hover[type] || type
    }

    //给元素绑定监听事件,可同时绑定多个事件类型，如['click','mouseover','mouseout'],也可以是'click mouseover mouseout'

    function add(element, events, fn, selector, getDelegate, capture) {
        var id = zid(element),
            set = (handlers[id] || (handlers[id] = [])) //元素上已经绑定的所有事件处理函数
        eachEvent(events, fn, function(event, fn) {
            var handler = parse(event)
            //保存fn,下面为了处理mouseenter, mouseleave时，对fn进行了修改
            handler.fn = fn
            handler.sel = selector
            // 模仿 mouseenter, mouseleave
            if (handler.e in hover) fn = function(e) {
                /*
                 relatedTarget为事件相关对象，只有在mouseover和mouseout事件时才有值
                 mouseover时表示的是鼠标移出的那个对象，mouseout时表示的是鼠标移入的那个对象
                 当related不存在，表示事件不是mouseover或者mouseout,mouseover时!$.contains(this, related)当相关对象不在事件对象内
                 且related !== this相关对象不是事件对象时，表示鼠标已经从事件对象外部移入到了对象本身，这个时间是要执行处理函数的
                 当鼠标从事件对象上移入到子节点的时候related就等于this了，且!$.contains(this, related)也不成立，这个时间是不需要执行处理函数的
                 */
                var related = e.relatedTarget
                if (!related || (related !== this && !$.contains(this, related))) return handler.fn.apply(this, arguments)
            }
            //事件委托
            handler.del = getDelegate && getDelegate(fn, event)
            var callback = handler.del || fn
            handler.proxy = function(e) {
                var result = callback.apply(element, [e].concat(e.data))
                //当事件处理函数返回false时，阻止默认操作和冒泡
                if (result === false) e.preventDefault(), e.stopPropagation()
                return result
            }
            //设置处理函数的在函数集中的位置
            handler.i = set.length
            //将函数存入函数集中
            set.push(handler)
            element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
        })
    }
    //删除绑定在元素上的指定类型的事件监听函数，可同时删除多种事件类型指定的函数，用数组或者还空格的字符串即可，同add

    function remove(element, events, fn, selector, capture) {
        var id = zid(element)
        eachEvent(events || '', fn, function(event, fn) {
            findHandlers(element, event, fn, selector).forEach(function(handler) {
                delete handlers[id][handler.i]
                element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
            })
        })
    }

    $.event = {
        add: add,
        remove: remove
    }

    //设置代理
    $.proxy = function(fn, context) {
        if ($.isFunction(fn)) {
            //如果fn是函数，则申明一个新的函数并用context作为上下文调用fn
            var proxyFn = function() {
                return fn.apply(context, arguments)
            }
            //引用fn标示符
            proxyFn._zid = zid(fn)
            return proxyFn
        } else if (typeof context == 'string') {
            return $.proxy(fn[context], fn)
        } else {
            throw new TypeError("expected function")
        }
    }

    $.fn.bind = function(event, callback) {
        return this.each(function() {
            add(this, event, callback)
        })
    }
    $.fn.unbind = function(event, callback) {
        return this.each(function() {
            remove(this, event, callback)
        })
    }
    //绑定一次性事件监听函数
    $.fn.one = function(event, callback) {
        return this.each(function(i, element) {
            //添加函数，然后在回调函数里再删除绑定。达到一次性事件的目的
            add(this, event, callback, null, function(fn, type) {
                return function() {
                    var result = fn.apply(element, arguments) //这里执行绑定的回调
                    remove(element, type, fn) //删除上面的绑定
                    return result
                }
            })
        })
    }

    var returnTrue = function() {
            return true
        },
        returnFalse = function() {
            return false
        },
        ignoreProperties = /^([A-Z]|layer[XY]$)/,
        eventMethods = {
            preventDefault: 'isDefaultPrevented', //是否调用过preventDefault方法
            //取消执行其他的事件处理函数并取消事件冒泡.如果同一个事件绑定了多个事件处理函数, 在其中一个事件处理函数中调用此方法后将不会继续调用其他的事件处理函数.
            stopImmediatePropagation: 'isImmediatePropagationStopped', //是否调用过stopImmediatePropagation方法，
            stopPropagation: 'isPropagationStopped' //是否调用过stopPropagation方法
        }
    //创建事件代理

    function createProxy(event) {
        var key, proxy = {
            originalEvent: event
        } //保存原始event
        for (key in event)
            if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key] //复制event属性至proxy

        //将preventDefault，stopImmediatePropagatio,stopPropagation方法定义到proxy上
        $.each(eventMethods, function(name, predicate) {
            proxy[name] = function() {
                this[predicate] = returnTrue
                return event[name].apply(event, arguments)
            }
            proxy[predicate] = returnFalse
        })
        return proxy
    }

    // emulates the 'defaultPrevented' property for browsers that have none
    //event.defaultPrevented返回一个布尔值,表明当前事件的默认动作是否被取消,也就是是否执行了 event.preventDefault()方法.

    function fix(event) {
        if (!('defaultPrevented' in event)) {
            event.defaultPrevented = false //初始值false
            var prevent = event.preventDefault // 引用默认preventDefault
            event.preventDefault = function() { //重写preventDefault
                this.defaultPrevented = true
                prevent.call(this)
            }
        }
    }
    //事件委托
    $.fn.delegate = function(selector, event, callback) {
        return this.each(function(i, element) {
            add(element, event, callback, selector, function(fn) {
                return function(e) {
                    //如果事件对象是element里的元素,取与selector相匹配的
                    var evt, match = $(e.target).closest(selector, element).get(0)
                    if (match) {
                        //evt成了一个拥有preventDefault，stopImmediatePropagatio,stopPropagation方法，currentTarge,liveFiredn属性的对象,另也有e的默认属性
                        evt = $.extend(createProxy(e), {
                            currentTarget: match,
                            liveFired: element
                        })
                        return fn.apply(match, [evt].concat([].slice.call(arguments, 1)))
                    }
                }
            })
        })
    }
    //取消事件委托
    $.fn.undelegate = function(selector, event, callback) {
        return this.each(function() {
            remove(this, event, callback, selector)
        })
    }

    $.fn.live = function(event, callback) {
        $(document.body).delegate(this.selector, event, callback)
        return this
    }
    $.fn.die = function(event, callback) {
        $(document.body).undelegate(this.selector, event, callback)
        return this
    }

    //on也有live和事件委托的效果，所以可以只用on来绑定事件
    $.fn.on = function(event, selector, callback) {
        return !selector || $.isFunction(selector) ? this.bind(event, selector || callback) : this.delegate(selector, event, callback)
    }
    $.fn.off = function(event, selector, callback) {
        return !selector || $.isFunction(selector) ? this.unbind(event, selector || callback) : this.undelegate(selector, event, callback)
    }
    //主动触发事件
    $.fn.trigger = function(event, data) {
        if (typeof event == 'string' || $.isPlainObject(event)) event = $.Event(event)
        fix(event)
        event.data = data
        return this.each(function() {
            // items in the collection might not be DOM elements
            // (todo: possibly support events on plain old objects)
            if ('dispatchEvent' in this) this.dispatchEvent(event)
        })
    }

    // triggers event handlers on current element just as if an event occurred,
    // doesn't trigger an actual event, doesn't bubble
    //触发元素上绑定的指定类型的事件，但是不冒泡
    $.fn.triggerHandler = function(event, data) {
        var e, result
        this.each(function(i, element) {
            e = createProxy(typeof event == 'string' ? $.Event(event) : event)
            e.data = data
            e.target = element
            //遍历元素上绑定的指定类型的事件处理函数集，按顺序执行，如果执行过stopImmediatePropagation，
            //那么e.isImmediatePropagationStopped()就会返回true,再外层函数返回false
            //注意each里的回调函数指定返回false时，会跳出循环，这样就达到的停止执行回面函数的目的
            $.each(findHandlers(element, event.type || event), function(i, handler) {
                result = handler.proxy(e)
                if (e.isImmediatePropagationStopped()) return false
            })
        })
        return result
    }

        // shortcut methods for `.bind(event, fn)` for each event type
    ;
    ('focusin focusout load resize scroll unload click dblclick ' +
        'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
        'change select keydown keypress keyup error').split(' ').forEach(function(event) {
            $.fn[event] = function(callback) {
                return callback ?
                    //如果有callback回调，则认为它是绑定
                    this.bind(event, callback) :
                    //如果没有callback回调，则让它主动触发
                    this.trigger(event)
            }
        })

    ;
    ['focus', 'blur'].forEach(function(name) {
        $.fn[name] = function(callback) {
            if (callback) this.bind(name, callback)
            else this.each(function() {
                try {
                    this[name]()
                } catch (e) {}
            })
            return this
        }
    })

    //根据参数创建一个event对象
    $.Event = function(type, props) {
        //当type是个对象时
        if (typeof type != 'string') props = type, type = props.type
        //创建一个event对象，如果是click,mouseover,mouseout时，创建的是MouseEvent,bubbles为是否冒泡
        var event = document.createEvent(specialEvents[type] || 'Events'),
            bubbles = true
        //确保bubbles的值为true或false,并将props参数的属性扩展到新创建的event对象上
        if (props) for (var name in props)(name == 'bubbles') ? (bubbles = !! props[name]) : (event[name] = props[name])
        //初始化event对象，type为事件类型，如click，bubbles为是否冒泡，第三个参数表示是否可以用preventDefault方法来取消默认操作
        event.initEvent(type, bubbles, true, null, null, null, null, null, null, null, null, null, null, null, null)
        //添加isDefaultPrevented方法，event.defaultPrevented返回一个布尔值,表明当前事件的默认动作是否被取消,也就是是否执行了 event.preventDefault()方法.
        event.isDefaultPrevented = function() {
            return this.defaultPrevented
        }
        return event
    }

})(Zepto)

/**
 Ajax处理部份
 **/
;
(function($) {
    var jsonpID = 0,
        document = window.document,
        key,
        name,
        rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        scriptTypeRE = /^(?:text|application)\/javascript/i,
        xmlTypeRE = /^(?:text|application)\/xml/i,
        jsonType = 'application/json',
        htmlType = 'text/html',
        blankRE = /^\s*$/

    // trigger a custom event and return false if it was cancelled

    function triggerAndReturn(context, eventName, data) {
        var event = $.Event(eventName)
        $(context).trigger(event, data)
        return !event.defaultPrevented
    }

    // trigger an Ajax "global" event
    //触发 ajax的全局事件

    function triggerGlobal(settings, context, eventName, data) {
        if (settings.global) return triggerAndReturn(context || document, eventName, data)
    }

    // Number of active Ajax requests
    $.active = 0

    //settings.global为true时表示需要触发全局ajax事件
    //注意这里的$.active++ === 0很巧妙，用它来判断开始，因为只有$.active等于0时$.active++ === 0才成立

    function ajaxStart(settings) {
        if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
    }
    //注意这里的 !(--$.active)同上面的异曲同工，--$.active为0，则表示$.active的值为1，这样用来判断结束，也很有意思

    function ajaxStop(settings) {
        if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
    }

    // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
    //触发全局ajaxBeforeSend事件，如果返回false,则取消此次请求

    function ajaxBeforeSend(xhr, settings) {
        var context = settings.context
        if (settings.beforeSend.call(context, xhr, settings) === false || triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false) return false

        triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
    }

    function ajaxSuccess(data, xhr, settings) {
        var context = settings.context,
            status = 'success'
        settings.success.call(context, data, status, xhr)
        triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
        ajaxComplete(status, xhr, settings)
    }
    // type: "timeout", "error", "abort", "parsererror"

    function ajaxError(error, type, xhr, settings) {
        var context = settings.context
        settings.error.call(context, xhr, type, error)
        triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error])
        ajaxComplete(type, xhr, settings)
    }
    // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"

    function ajaxComplete(status, xhr, settings) {
        var context = settings.context
        settings.complete.call(context, xhr, status)
        triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
        ajaxStop(settings)
    }

    // Empty function, used as default callback

    function empty() {}
    //可参考http://zh.wikipedia.org/zh-cn/JSONP
    $.ajaxJSONP = function(options) {
        if (!('type' in options)) return $.ajax(options)

        var callbackName = 'jsonp' + (++jsonpID), //创建回调函数名
            script = document.createElement('script'),
        //js文件加载完毕
            cleanup = function() {
                clearTimeout(abortTimeout) //清除下面的timeout事件处理
                $(script).remove() //移除创建的script标签，因为该文件的JS内容已经解析过了
                delete window[callbackName] //清除掉指定的回调函数
            },
        //取消加载
            abort = function(type) {
                cleanup()
                // In case of manual abort or timeout, keep an empty function as callback
                // so that the SCRIPT tag that eventually loads won't result in an error.
                //这里通过将回调函数重新赋值为空函数来达到看似阻止加载JS的目的，实际上给script标签设置了src属性后，请求就已经产生了，并且不能中断
                if (!type || type == 'timeout') window[callbackName] = empty
                ajaxError(null, type || 'abort', xhr, options)
            },
            xhr = {
                abort: abort
            }, abortTimeout

        if (ajaxBeforeSend(xhr, options) === false) {
            abort('abort')
            return false
        }
        //成功加载后的回调函数
        window[callbackName] = function(data) {
            cleanup()
            ajaxSuccess(data, xhr, options)
        }

        script.onerror = function() {
            abort('error')
        }
        //将回调函数名追加到请求地址，并赋给script，至此请求产生
        script.src = options.url.replace(/=\?/, '=' + callbackName)
        $('head').append(script)

        //如果设置了超时处理
        if (options.timeout > 0) abortTimeout = setTimeout(function() {
            abort('timeout')
        }, options.timeout)

        return xhr
    }

    //ajax全局设置
    $.ajaxSettings = {
        // Default type of request
        type: 'GET',
        // Callback that is executed before request
        beforeSend: empty,
        // Callback that is executed if the request succeeds
        success: empty,
        // Callback that is executed the the server drops error
        error: empty,
        // Callback that is executed on request complete (both: error and success)
        complete: empty,
        // The context for the callbacks
        context: null,
        // Whether to trigger "global" Ajax events
        global: true,
        // Transport
        xhr: function() {
            return new window.XMLHttpRequest()
        },
        // MIME types mapping
        accepts: {
            script: 'text/javascript, application/javascript',
            json: jsonType,
            xml: 'application/xml, text/xml',
            html: htmlType,
            text: 'text/plain'
        },
        // Whether the request is to another domain
        crossDomain: false,
        // Default timeout
        timeout: 0,
        // Whether data should be serialized to string
        processData: true,
        // Whether the browser should be allowed to cache GET responses
        cache: true
    };

    //根据MIME返回相应的数据类型，用作ajax参数里的dataType用，设置预期返回的数据类型
    //如html,json,scirpt,xml,text

    function mimeToDataType(mime) {
        if (mime) mime = mime.split(';', 2)[0]
        return mime && (mime == htmlType ? 'html' : mime == jsonType ? 'json' : scriptTypeRE.test(mime) ? 'script' : xmlTypeRE.test(mime) && 'xml') || 'text'
    }
    //将查询字符串追加到URL后面

    function appendQuery(url, query) {
        //注意这里的replace,将第一个匹配到的&或者&&,&?,? ?& ??替换成?,用来保证地址的正确性
        return (url + '&' + query).replace(/[&?]{1,2}/, '?')
    }

    // serialize payload and append it to the URL for GET requests
    //序列化发送到服务器上的数据，如果是GET请求，则将序列化后的数据追加到请求地址后面

    function serializeData(options) {
        //options.processData表示对于非Get请求,是否自动将 options.data转换为字符串,前提是options.data不是字符串
        if (options.processData && options.data && $.type(options.data) != "string")
        //options.traditional表示是否以$.param方法序列化
            options.data = $.param(options.data, options.traditional)
        if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
        //如果是GET请求，将序列化后的数据追加到请求地址后面
            options.url = appendQuery(options.url, options.data)
    }

    $.ajax = function(options) {
        //注意这里不能直接将$.ajaxSettings替换掉$.extend的第一个参数,这样会改变 $.ajaxSettings里面的值
        //这里的做法是创建一个新对象
        var settings = $.extend({}, options || {})
        //如果它没有定义$.ajaxSettings里面的属性的时候，才去将$.ajaxSettings[key] 复制过来
        for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]
        //执行全局ajaxStart
        ajaxStart(settings)

        //通过判断请求地址和当前页面地址的host是否相同来设置是跨域
        if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) && RegExp.$2 != window.location.host
        //如果没有设置请求地址，则取当前页面地址
        if (!settings.url) settings.url = window.location.toString();
        //将data进行转换
        serializeData(settings);
        //如果不设置缓存
        if (settings.cache === false) settings.url = appendQuery(settings.url, '_=' + Date.now())

        //如果请求的是jsonp，则将地址栏里的=?替换为callback=?,相当于一个简写
        var dataType = settings.dataType,
            hasPlaceholder = /=\?/.test(settings.url)
        if (dataType == 'jsonp' || hasPlaceholder) {
            if (!hasPlaceholder) settings.url = appendQuery(settings.url, 'callback=?')
            return $.ajaxJSONP(settings)
        }

        var mime = settings.accepts[dataType],
            baseHeaders = {},
        //如果请求地址没有定请求协议，则与当前页面协议相同
            protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
            xhr = settings.xhr(),
            abortTimeout
        //如果没有跨域
        if (!settings.crossDomain) baseHeaders['X-Requested-With'] = 'XMLHttpRequest'
        if (mime) {
            baseHeaders['Accept'] = mime
            if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
            xhr.overrideMimeType && xhr.overrideMimeType(mime)
        }
        //如果不是GET请求，设置发送信息至服务器时内容编码类型
        if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET')) baseHeaders['Content-Type'] = (settings.contentType || 'application/x-www-form-urlencoded')
        settings.headers = $.extend(baseHeaders, settings.headers || {})

        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                xhr.onreadystatechange = empty;
                clearTimeout(abortTimeout)
                var result, error = false
                //根据状态来判断请求是否成功
                //状态>=200 && < 300 表示成功
                //状态 == 304 表示文件未改动过，也可认为成功
                //如果是取要本地文件那也可以认为是成功的，xhr.status == 0是在直接打开页面时发生请求时出现的状态，也就是不是用localhost的形式访问的页面的情况
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
                    //获取返回的数据类型
                    dataType = dataType || mimeToDataType(xhr.getResponseHeader('content-type'))
                    result = xhr.responseText

                    try {
                        // http://perfectionkills.com/global-eval-what-are-the-options/
                        if (dataType == 'script')(1, eval)(result) //如果返回的数据类型是JS
                        else if (dataType == 'xml') result = xhr.responseXML
                        else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
                    } catch (e) {
                        error = e
                    }
                    //如果解析出错，则执行全局parsererror事件
                    if (error) ajaxError(error, 'parsererror', xhr, settings)
                    //否则执行ajaxSuccess
                    else ajaxSuccess(result, xhr, settings)
                } else {
                    //如果请求出错，则根据xhr.status来执行相应的错误处理函数
                    ajaxError(null, xhr.status ? 'error' : 'abort', xhr, settings)
                }
            }
        }

        var async = 'async' in settings ? settings.async : true
        xhr.open(settings.type, settings.url, async)
        //设置请求头信息
        for (name in settings.headers) xhr.setRequestHeader(name, settings.headers[name])

        //如果ajaxBeforeSend函数返回的false，则取消此次请示
        if (ajaxBeforeSend(xhr, settings) === false) {
            xhr.abort()
            return false
        }

        //当设置了settings.timeout，则在超时后取消请求，并执行timeout事件处理函数
        if (settings.timeout > 0) abortTimeout = setTimeout(function() {
            xhr.onreadystatechange = empty
            xhr.abort()
            ajaxError(null, 'timeout', xhr, settings)
        }, settings.timeout)

        // avoid sending empty string (#319)
        xhr.send(settings.data ? settings.data : null)
        return xhr
    }

    // handle optional data/success arguments
    //将参数转换成ajax函数指定的参数格式

    function parseArguments(url, data, success, dataType) {
        var hasData = !$.isFunction(data) //如果data是function，则认为它是请求成功后的回调
        return {
            url: url,
            data: hasData ? data : undefined, //如果data不是function实例
            success: !hasData ? data : $.isFunction(success) ? success : undefined,
            dataType: hasData ? dataType || success : success
        }
    }

    //简单的get请求
    $.get = function(url, data, success, dataType) {
        return $.ajax(parseArguments.apply(null, arguments))
    }

    $.post = function(url, data, success, dataType) {
        var options = parseArguments.apply(null, arguments)
        options.type = 'POST'
        return $.ajax(options)
    }

    $.getJSON = function(url, data, success) {
        var options = parseArguments.apply(null, arguments)
        options.dataType = 'json'
        return $.ajax(options)
    }

    //这里的url可以是http://www.xxxx.com selector这种形式，就是对加载进来的HTML对行一个筛选
    $.fn.load = function(url, data, success) {
        if (!this.length) return this
        //将请求地址用空格分开
        var self = this,
            parts = url.split(/\s/),
            selector,
            options = parseArguments(url, data, success),
            callback = options.success
        if (parts.length > 1) options.url = parts[0], selector = parts[1]
        //要对成功后的回调函数进行一个改写，因为需要将加载进来的HTML添加进当前集合
        options.success = function(response) {
            //selector就是对请求到的数据就行一个筛选的条件，比如只获取数据里的类名为.test的标签
            self.html(selector ? $('<div>').html(response.replace(rscript, "")).find(selector) : response)
            //这里才是你写的回调
            callback && callback.apply(self, arguments)
        }
        $.ajax(options)
        return this
    }

    var escape = encodeURIComponent

    function serialize(params, obj, traditional, scope) {
        var type, array = $.isArray(obj)
        $.each(obj, function(key, value) {
            type = $.type(value)
            //scope用作处理value也是object或者array的情况
            //traditional表示是否以传统的方式拼接数据，
            //传统的意思就是比如现有一个数据{a:[1,2,3]},转成查询字符串后结果为'a=1&a=2&a=3'
            //非传统的的结果则是a[]=1&a[]=2&a[]=3
            if (scope) key = traditional ? scope : scope + '[' + (array ? '' : key) + ']'
            // handle data in serializeArray() format
            //当处理的数据为[{},{},{}]这种情况的时候，一般指的是序列化表单后的结果
            if (!scope && array) params.add(value.name, value.value)
            // recurse into nested objects
            //当value值是数组或者是对象且不是按传统的方式序列化的时候，需要再次遍历value
            else if (type == "array" || (!traditional && type == "object")) serialize(params, value, traditional, key)
            else params.add(key, value)
        })
    }
    //将obj转换为查询字符串的格式，traditional表示是否转换成传统的方式，至于传统的方式的意思看上面的注释
    $.param = function(obj, traditional) {
        var params = []
        //注意这里将add方法定到params，所以下面serialize时才不需要返回数据
        params.add = function(k, v) {
            this.push(escape(k) + '=' + escape(v))
        }
        serialize(params, obj, traditional)
        return params.join('&').replace(/%20/g, '+')
    }
})(Zepto)

;
(function($) {
    //序列化表单，返回一个类似[{name:value},{name2:value2}]的数组
    $.fn.serializeArray = function() {
        var result = [],
            el
        //将集合中的第一个表单里的所有表单元素转成数组后进行遍历
        $(Array.prototype.slice.call(this.get(0).elements)).each(function() {
            el = $(this)
            var type = el.attr('type')
            //判断其type属性，排除fieldset，submi,reset,button以及没有被选中的radio和checkbox
            if (this.nodeName.toLowerCase() != 'fieldset' && !this.disabled && type != 'submit' && type != 'reset' && type != 'button' &&
                //注意这里的写法，当元素既不是radio也不是checkbox时,直接返回true，
                //当元素是radio或者checkbox时，会执行后面的this.checked，当radio或者checkbox被选中时this.checked得到true值
                //这样就可以筛选中被选中的radio和checkbox了
                ((type != 'radio' && type != 'checkbox') || this.checked)) result.push({
                name: el.attr('name'),
                value: el.val()
            })
        })
        return result
    }
    //将表单的值转成name1=value1&name2=value2的形式
    $.fn.serialize = function() {
        var result = []
        this.serializeArray().forEach(function(elm) {
            result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value))
        })
        return result.join('&')
    }
    //表单提交
    $.fn.submit = function(callback) {
        if (callback) this.bind('submit', callback)
        else if (this.length) {
            var event = $.Event('submit')
            this.eq(0).trigger(event)
            if (!event.defaultPrevented) this.get(0).submit()
        }
        return this
    }

})(Zepto)

//CSS3动画
;
(function($, undefined) {
    var prefix = '',
        eventPrefix, endEventName, endAnimationName,
        vendors = {
            Webkit: 'webkit',
            Moz: '',
            O: 'o',
            ms: 'MS'
        },
        document = window.document,
        testEl = document.createElement('div'),
        supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
        transform,
        transitionProperty, transitionDuration, transitionTiming,
        animationName, animationDuration, animationTiming,
        cssReset = {}
    //将驼峰式的字符串转成用-分隔的小写形式，如borderWidth ==> border-width

    function dasherize(str) {
        return downcase(str.replace(/([a-z])([A-Z])/, '$1-$2'))
    }

    function downcase(str) {
        return str.toLowerCase()
    }
    //用于修正事件名

    function normalizeEvent(name) {
        return eventPrefix ? eventPrefix + name : downcase(name)
    }

    //根据浏览器的特性设置CSS属性前轻辍和事件前辍，比如浏览器内核是webkit
    //那么用于设置CSS属性的前辍prefix就等于'-webkit-',用来修正事件名的前辍eventPrefix就是Webkit
    $.each(vendors, function(vendor, event) {
        if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
            prefix = '-' + downcase(vendor) + '-'
            eventPrefix = event
            return false
        }
    })

    transform = prefix + 'transform'
    cssReset[transitionProperty = prefix + 'transition-property'] = cssReset[transitionDuration = prefix + 'transition-duration'] = cssReset[transitionTiming = prefix + 'transition-timing-function'] = cssReset[animationName = prefix + 'animation-name'] = cssReset[animationDuration = prefix + 'animation-duration'] = cssReset[animationTiming = prefix + 'animation-timing-function'] = ''

    $.fx = {
        off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
        speeds: {
            _default: 400,
            fast: 200,
            slow: 600
        },
        cssPrefix: prefix,
        transitionEnd: normalizeEvent('TransitionEnd'),
        animationEnd: normalizeEvent('AnimationEnd')
    }

    $.fn.animate = function(properties, duration, ease, callback) {
        if ($.isPlainObject(duration)) ease = duration.easing, callback = duration.complete, duration = duration.duration
        //如果duration是数字时，表示动画持续时间，如果是字符串，则从$.fx.speeds中取出相对应的值，如果没有找到相应的值，对取默认值
        if (duration) duration = (typeof duration == 'number' ? duration : ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000
        return this.anim(properties, duration, ease, callback)
    }

    $.fn.anim = function(properties, duration, ease, callback) {
        var key, cssValues = {}, cssProperties, transforms = '',
            that = this,
            wrappedCallback, endEvent = $.fx.transitionEnd
        //动画持续时间默认值
        if (duration === undefined) duration = 0.4
        //如果浏览器不支持CSS3的动画，则duration=0，意思就是直接跳转最终值
        if ($.fx.off) duration = 0

        //如果properties是一个动画名keyframe
        if (typeof properties == 'string') {
            // keyframe animation
            cssValues[animationName] = properties
            cssValues[animationDuration] = duration + 's'
            cssValues[animationTiming] = (ease || 'linear')
            endEvent = $.fx.animationEnd
        } else {
            cssProperties = []
            // CSS transitions
            for (key in properties)
                //如果设置 的CSS属性是变形之类的
                if (supportedTransforms.test(key)) transforms += key + '(' + properties[key] + ') '
                else cssValues[key] = properties[key], cssProperties.push(dasherize(key))

            if (transforms) cssValues[transform] = transforms, cssProperties.push(transform)
            if (duration > 0 && typeof properties === 'object') {
                cssValues[transitionProperty] = cssProperties.join(', ')
                cssValues[transitionDuration] = duration + 's'
                cssValues[transitionTiming] = (ease || 'linear')
            }
        }

        wrappedCallback = function(event) {
            if (typeof event !== 'undefined') {
                if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
                $(event.target).unbind(endEvent, wrappedCallback)
            }
            $(this).css(cssReset)
            callback && callback.call(this)
        }
        //当可以执行动画的时候，那么动画结束后会执行回调，
        //如果不支持持续动画,在直接设置最终值后，不会执行动画结束回调
        if (duration > 0) this.bind(endEvent, wrappedCallback)

        // trigger page reflow so new elements can animate
        this.size() && this.get(0).clientLeft

        //设置
        this.css(cssValues)

        //当持续时间小于等于0时，立刻还原
        if (duration <= 0) setTimeout(function() {
            that.each(function() {
                wrappedCallback.call(this)
            })
        }, 0)

        return this
    }

    testEl = null
})(Zepto)
/**
 * @import core/zepto-touch.js
 * @file 提供简单的手势支持
 */
//     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
    var touch = {},
        touchTimeout, tapTimeout, swipeTimeout,
        longTapDelay = 750, longTapTimeout

    function parentIfText(node) {
        return 'tagName' in node ? node : node.parentNode
    }

    function swipeDirection(x1, x2, y1, y2) {
        var xDelta = Math.abs(x1 - x2), yDelta = Math.abs(y1 - y2)
        return xDelta >= yDelta ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
    }

    function longTap() {
        longTapTimeout = null
        if (touch.last) {
            touch.el.trigger('longTap')
            touch = {}
        }
    }

    function cancelLongTap() {
        if (longTapTimeout) clearTimeout(longTapTimeout)
        longTapTimeout = null
    }

    function cancelAll() {
        if (touchTimeout) clearTimeout(touchTimeout)
        if (tapTimeout) clearTimeout(tapTimeout)
        if (swipeTimeout) clearTimeout(swipeTimeout)
        if (longTapTimeout) clearTimeout(longTapTimeout)
        touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
        touch = {}
    }

    $(document).ready(function(){
        var now, delta

        $(document.body)
            .bind('touchstart', function(e){
                now = Date.now()
                delta = now - (touch.last || now)
                touch.el = $(parentIfText(e.touches[0].target))
                touchTimeout && clearTimeout(touchTimeout)
                touch.x1 = e.touches[0].pageX
                touch.y1 = e.touches[0].pageY
                if (delta > 0 && delta <= 250) touch.isDoubleTap = true
                touch.last = now
                longTapTimeout = setTimeout(longTap, longTapDelay)
            })
            .bind('touchmove', function(e){
                cancelLongTap()
                touch.x2 = e.touches[0].pageX
                touch.y2 = e.touches[0].pageY
            })
            .bind('touchend', function(e){
                cancelLongTap()

                // swipe
                if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
                    (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30))

                    swipeTimeout = setTimeout(function() {
                        touch.el.trigger('swipe')
                        touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)))
                        touch = {}
                    }, 0)

                // normal tap
                else if ('last' in touch)

                // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
                // ('tap' fires before 'scroll')
                    tapTimeout = setTimeout(function() {

                        // trigger universal 'tap' with the option to cancelTouch()
                        // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
                        var event = $.Event('tap')
                        event.cancelTouch = cancelAll
                        touch.el.trigger(event)

                        // trigger double tap immediately
                        if (touch.isDoubleTap) {
                            touch.el.trigger('doubleTap')
                            touch = {}
                        }

                        // trigger single tap after 250ms of inactivity
                        else {
                            touchTimeout = setTimeout(function(){
                                touchTimeout = null
                                touch.el.trigger('singleTap')
                                touch = {}
                            }, 250)
                        }

                    }, 0)

            })
            .bind('touchcancel', cancelAll)

        $(window).bind('scroll', cancelAll)
    })
	;['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(m){
	        $.fn[m] = function(callback){ return this.bind(m, callback) }
	})
	if('ontouchstart' in window){
        //如果是触摸屏，则将click转为tap
        $.fn["click"] = $.fn["tap"];
    }else{
    	// 如果是pc端访问，将tap事件转换为click事件
	    $.fn["tap"] = $.fn["click"];
    }
    var  QueryString = function () {
        // This function is anonymous, is executed immediately and
        // the return value is assigned to QueryString!
        var query_string = {};
        var query = decodeURIComponent(window.location.search.substring(1));
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            // If first entry with this name
            if (typeof query_string[pair[0]] === "undefined") {
                query_string[pair[0]] = pair[1];
                // If second entry with this name
            } else if (typeof query_string[pair[0]] === "string") {
                var arr = [ query_string[pair[0]], pair[1] ];
                query_string[pair[0]] = arr;
                // If third or later entry with this name
            } else {
                query_string[pair[0]].push(pair[1]);
            }
        }
        return query_string;
    } ();
    $.getParam = function (name) {
        return QueryString[name];
    };

    function speedUpTagClick (anchors) {
        for (var i = 0; i < anchors.length; i += 1) {
            var anchor = anchors[i];
            if (anchor.onclick == undefined) {
                continue;
            }
            $(anchor).click(anchor.onclick);
            anchor.onclick = undefined;
        }
    }
    $(document).ready(function () {
        //替换页面标签自身的click事件捕获，改用zepto自身的tap捕获来代替
        //如果页面结构或者脚本解析有异常，有可能导致替换失败
        speedUpTagClick(document.getElementsByTagName("a"));
        speedUpTagClick(document.getElementsByTagName("li"));
        speedUpTagClick(document.getElementsByTagName("button"));
        speedUpTagClick(document.getElementsByTagName("h2"));
    }, true);

})(Zepto);
