import {attr} from './attr';
import {Promise} from './promise';
import {once, trigger} from './event';
import {css, propName} from './style';
import {assign, startsWith, toNodes} from './lang';
import {addClass, hasClass, removeClass, removeClasses} from './class';

export function transition(element, props, duration = 400, timing = 'linear') {

    return Promise.all(toNodes(element).map(element =>
        new Promise((resolve, reject) => {

            for (const name in props) {
                const value = css(element, name);
                if (value === '') {
                    css(element, name, value);
                }
            }

            const timer = setTimeout(() => trigger(element, 'transitionend'), duration);

            once(element, 'transitionend transitioncanceled', ({type}) => {
                clearTimeout(timer);
                removeClass(element, 'uk-transition');
                css(element, {
                    transitionProperty: '',
                    transitionDuration: '',
                    transitionTimingFunction: ''
                });
                type === 'transitioncanceled' ? reject() : resolve();
            }, {self: true});

            addClass(element, 'uk-transition');
            css(element, assign({
                transitionProperty: Object.keys(props).map(propName).join(','),
                transitionDuration: `${duration}ms`,
                transitionTimingFunction: timing
            }, props));

        })
    ));

}

export const Transition = {

    start: transition,

    stop(element) {
        trigger(element, 'transitionend');
        return Promise.resolve();
    },

    cancel(element) {
        trigger(element, 'transitioncanceled');
    },

    inProgress(element) {
        return hasClass(element, 'uk-transition');
    }

};

const animationPrefix = 'uk-animation-';

export function animate(element, animation, duration = 200, origin, out) {

    return Promise.all(toNodes(element).map(element =>
        new Promise((resolve, reject) => {

            reset();

            once(element, 'animationend animationcancel', ({type}) => {

                if (type === 'animationcancel') {
                    reject();
                } else {
                    resolve();
                }

                reset();

            }, {self: true});

            css(element, 'animationDuration', `${duration}ms`);
            addClass(element, animation, animationPrefix + (out ? 'leave' : 'enter'));

            if (startsWith(animation, animationPrefix)) {
                addClass(element, origin && `uk-transform-origin-${origin}`, out && `${animationPrefix}reverse`);
            }

            function reset() {
                css(element, 'animationDuration', '');
                removeClasses(element, `${animationPrefix}\\S*`);
            }

        })
    ));

}

const inProgress = new RegExp(`${animationPrefix}(enter|leave)`);
export const Animation = {

    in(element, animation, duration, origin) {
        return animate(element, animation, duration, origin, false);
    },

    out(element, animation, duration, origin) {
        return animate(element, animation, duration, origin, true);
    },

    inProgress(element) {
        return inProgress.test(attr(element, 'class'));
    },

    cancel(element) {
        trigger(element, 'animationcancel');
    }

};
