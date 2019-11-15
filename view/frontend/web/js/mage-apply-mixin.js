// Code copied from Magento core, and instrumentation added

define([
    'underscore',
    'jquery',
    'mage/apply/scripts'
], function(_, $, processScripts) {
    return function() {
        var dataAttr = 'data-mage-init';
        var nodeSelector = '[' + dataAttr + ']';
        var mark = function() {};
        var measure = function() {};
        if (window.performance && window.performance.mark) {
            mark = performance.mark.bind(performance);
            measure = performance.measure.bind(performance)
        }

        /**
         * Initializes components assigned to a specified element via data-* attribute.
         *
         * @param {HTMLElement} el - Element to initialize components with.
         * @param {Object|String} config - Initial components' config.
         * @param {String} component - Components' path.
         */
        function init(el, config, component) {
            var PERF_NAME = component;
            if (config && config.components) {
                PERF_NAME = component + ' (' + Object.keys(config.components).join(' ') + ')';
            }

            require([component], function (fn) {
                mark(PERF_NAME + ':execstart');
                if (typeof fn === 'object') {
                    fn = fn[component].bind(fn);
                }

                if (_.isFunction(fn)) {
                    fn(config, el);
                } else if ($(el)[component]) {
                    $(el)[component](config);
                }

                mark(PERF_NAME + ':execend');
                measure(
                    PERF_NAME + ' exec time',
                    PERF_NAME + ':execstart',
                    PERF_NAME + ':execend'
                );
            }, function (error) {
                if ('console' in window && typeof window.console.error === 'function') {
                    console.error(error);
                }

                return true;
            });
        }

        /**
         * Parses elements 'data-mage-init' attribute as a valid JSON data.
         * Note: data-mage-init attribute will be removed.
         *
         * @param {HTMLElement} el - Element whose attribute should be parsed.
         * @returns {Object}
         */
        function getData(el) {
            var data = el.getAttribute(dataAttr);

            el.removeAttribute(dataAttr);

            return {
                el: el,
                data: JSON.parse(data)
            };
        }

        return {
            /**
             * Initializes components assigned to HTML elements via [data-mage-init].
             *
             * @example Sample 'data-mage-init' declaration.
             *      data-mage-init='{"path/to/component": {"foo": "bar"}}'
             */
            apply: function (context) {
                var virtuals = processScripts(!context ? document : context),
                    nodes = document.querySelectorAll(nodeSelector);

                _.toArray(nodes)
                    .map(getData)
                    .concat(virtuals)
                    .forEach(function (itemContainer) {
                        var element = itemContainer.el;

                        _.each(itemContainer.data, function (obj, key) {
                                if (obj.mixins) {
                                    require(obj.mixins, function () { //eslint-disable-line max-nested-callbacks
                                        var i, len;

                                        for (i = 0, len = arguments.length; i < len; i++) {
                                            $.extend(
                                                true,
                                                itemContainer.data[key],
                                                arguments[i](itemContainer.data[key], element)
                                            );
                                        }

                                        delete obj.mixins;
                                        init.call(null, element, obj, key);
                                    });
                                } else {
                                    init.call(null, element, obj, key);
                                }

                            }
                        );

                    });
            },
            applyFor: init
        };
    };
});
