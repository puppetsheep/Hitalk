﻿/*
 * @Author: ihoey 
 * @Date: 2018-04-20 23:53:17 
 * @Last Modified by: ihoey
 * @Last Modified time: 2018-04-23 18:23:04
 */

import md5 from 'blueimp-md5';
import marked from 'marked';
import detect from './detect';
const gravatar = {
    cdn: 'https://gravatar.cat.net/avatar/',
    ds: ['mm', 'identicon', 'monsterid', 'wavatar', 'retro', ''],
    params: '?s=40',
    hide: !1
};
const defaultComment = {
    comment: '',
    rid: '',
    nick: 'Guest',
    mail: '',
    link: '',
    ua: navigator.userAgent,
    url: '',
    pin: 0,
    like: 0
};
const GUEST_INFO = ['nick', 'mail', 'link'];

const smiliesData = {
    '泡泡': `呵呵|哈哈|吐舌|太开心|笑眼|花心|小乖|乖|捂嘴笑|滑稽|你懂的|不高兴|怒|汗|黑线|泪|真棒|喷|惊哭|阴险|鄙视|酷|啊|狂汗|what|疑问|酸爽|呀咩爹|委屈|惊讶|睡觉|笑尿|挖鼻|吐|犀利|小红脸|懒得理|勉强|爱心|心碎|玫瑰|礼物|彩虹|太阳|星星月亮|钱币|茶杯|蛋糕|大拇指|胜利|haha|OK|沙发|手纸|香蕉|便便|药丸|红领巾|蜡烛|音乐|灯泡|开心|钱|咦|呼|冷|生气|弱`,
    '阿鲁': `高兴|小怒|脸红|内伤|装大款|赞一个|害羞|汗|吐血倒地|深思|不高兴|无语|亲亲|口水|尴尬|中指|想一想|哭泣|便便|献花|皱眉|傻笑|狂汗|吐|喷水|看不见|鼓掌|阴暗|长草|献黄瓜|邪恶|期待|得意|吐舌|喷血|无所谓|观察|暗地观察|肿包|中枪|大囧|呲牙|抠鼻|不说话|咽气|欢呼|锁眉|蜡烛|坐等|击掌|惊喜|喜极而泣|抽烟|不出所料|愤怒|无奈|黑线|投降|看热闹|扇耳光|小眼睛|中刀`
}
const pReg = new RegExp("\\@\\(\\s*(" + smiliesData.泡泡 + "\)\\s*\\)")
const aReg = new RegExp("\\#\\(\\s*(" + smiliesData.阿鲁 + "\)\\s*\\)")
var subfix = "";
if (window.devicePixelRatio != undefined && window.devicePixelRatio >= 1.49) {
    subfix = "@2x";
}

const store = localStorage;
class Hitalk {
    /**
     * Hitalk constructor function
     * @param {Object} option
     * @constructor
     */
    constructor(option) {
        let _root = this;
        // version
        _root.version = '1.1.8-beta';

        _root.md5 = md5;
        // Hitalk init
        !!option && _root.init(option);
    }

    /**
     * Hitalk Init
     * @param {Object} option
     */
    init(option) {
        let _root = this;
        try {
            // get el
            let el = ({}).toString.call(option.el) === "[object HTMLDivElement]" ? option.el : document.querySelectorAll(option.el)[0];
            if (({}).toString.call(el) != '[object HTMLDivElement]') {
                throw `The target element was not found.`;
            }
            _root.el = el;
            _root.el.classList.add('Hitalk');

            // 自定义 header
            const guest_info = option.guest_info || GUEST_INFO;
            const inputEl = guest_info.map(item => {
                switch (item) {
                    case 'nick':
                        return '<input name="nick" placeholder="称呼" class="vnick vinput" type="text">';
                        break;
                    case 'mail':
                        return '<input name="mail" placeholder="邮箱" class="vmail vinput" type="email">';
                        break;
                    case 'link':
                        return '<input name="link" placeholder="网址 http(s)://" class="vlink vinput" type="text">';
                        break;
                    default:
                        return '';
                        break;
                }
            });

            // 填充元素
            let placeholder = option.placeholder || '';
            let eleHTML = `
            <div class="vwrap">
                <div class="${`vheader item${inputEl.length}`}">${inputEl.join('')}</div>
                <div class="vedit">
                    <textarea class="veditor vinput" placeholder="${placeholder}"></textarea>
                </div>
                <div class="vcontrol">
                    <span class="col col-60 smilies">
                        <div class="col smilies-logo"><span>^_^</span></div>
                        <div class="col" title="Markdown is Support">MarkDown is Support</div>
                        <div class="smilies-body"></div>
                    </span>
                    <div class="col col-40 text-right">
                        <button type="button" class="vsubmit vbtn">回复</button>
                    </div>
                </div>
                <div style="display:none;" class="vmark"></div>
            </div>
            <div class="info">
                <div class="count col"></div>
            </div>
            <div class="vloading"></div>
            <div class="vempty" style="display:none;"></div>
            <ul class="vlist"></ul>
            <div class="vpage txt-center"></div>`;
            _root.el.innerHTML = eleHTML;

            // 填充表情节点
            let smiliesNode = _root.el.querySelector('.smilies-body');
            let ulNode, liNode = '';
            let fragment = document.createDocumentFragment();
            Object.keys(smiliesData).forEach((y, i) => {
                ulNode = document.createElement("ul");
                ulNode.setAttribute('class', 'smilies-items smilies-items-biaoqing' + (y == '泡泡' ? ' smilies-items-show' : ''))
                ulNode.setAttribute('data-id', i)
                smiliesData[y].split('|').forEach(e => {
                    ulNode.innerHTML += `<li class="smilies-item" title="${e}" data-input="${(y == '泡泡' ? '@' : '#') + `(${e})`}"><img class="biaoqing ${y == '泡泡' ? 'newpaopao' : 'alu'}" title="${e}" src="https://cdn.dode.top/${y == '泡泡' ? 'newpaopao' : 'alu'}/${e + subfix}.png"></li>`
                })
                liNode += `<li class="smilies-name ${y == '泡泡' ? 'smilies-package-active' : ''}" data-id="${i}"><span>${y}</span></li>`
                fragment.appendChild(ulNode);
            })
            let divNode = document.createElement("div");
            divNode.setAttribute('class', 'smilies-bar')
            divNode.innerHTML = `<ul class="smilies-packages">${liNode}</ul>`
            fragment.appendChild(divNode);
            smiliesNode.appendChild(fragment);

            let smilies = document.querySelector('.smilies')
            let _el = document.querySelector('.veditor')

            Event.on('click', smilies, e => {
                e = e.target
                if (e.className == 'smilies-item') {
                    _el.value += ` ${e.getAttribute('data-input')} `
                    defaultComment.comment = marked(_el.value, {
                        sanitize: !0
                    })
                    smilies.classList.remove('smilies-open')
                } else if (e.classList.contains('smilies-logo')) {
                    smilies.classList.toggle('smilies-open')
                } else if (e.classList.contains('smilies-name')) {
                    if (!e.classList.contains('smilies-package-active')) {
                        document.querySelectorAll('.smilies-name').forEach(e => e.classList.remove('smilies-package-active'))
                        document.querySelectorAll('.smilies-items').forEach(e => e.classList.remove('smilies-items-show'))
                        document.querySelectorAll('.smilies-items')[e.getAttribute('data-id')].classList.add('smilies-items-show')
                        e.classList.add('smilies-package-active')

                    }
                }
            })

            Event.on('mouseup', document, e => {
                e = e.target
                let _con = document.querySelector('.smilies')
                if (!_con === e || !_con.contains(e)) {
                    smilies.classList.remove('smilies-open')
                }
            })

            // Empty Data
            let vempty = _root.el.querySelector('.vempty');
            _root.nodata = {
                show(txt) {
                    vempty.innerHTML = txt || `还没有评论哦，快来抢沙发吧!`;
                    vempty.setAttribute('style', 'display:block;');
                },
                hide() {
                    vempty.setAttribute('style', 'display:none;');
                }
            }

            // loading
            let _spinner = `<div class="spinner"><div class="r1"></div><div class="r2"></div><div class="r3"></div><div class="r4"></div><div class="r5"></div></div>`;
            let vloading = _root.el.querySelector('.vloading');
            vloading.innerHTML = _spinner;
            // loading control
            _root.loading = {
                show() {
                    vloading.setAttribute('style', 'display:block;');
                    _root.nodata.hide();
                },
                hide() {
                    vloading.setAttribute('style', 'display:none;');
                    _root.el.querySelectorAll('.vcard').length === 0 && _root.nodata.show();
                }
            };
            //_root.nodata.show();

            _root.notify = option.notify || !1;
            _root.verify = option.verify || !1;

            gravatar['params'] = '?d=' + (gravatar['ds'].indexOf(option.avatar) > -1 ? option.avatar : 'mm');
            gravatar['hide'] = option.avatar === 'hide' ? !0 : !1;

            // init av
            let av = option.av || AV;
            let appId = option.app_id || option.appId;
            let appKey = option.app_key || option.appKey;
            if (!appId || !appKey) {
                _root.loading.hide();
                throw '初始化失败，请检查你的appid或者appkey.';
                return;
            }
            av.applicationId = null;
            av.init({
                appId: appId,
                appKey: appKey
            });
            _root.v = av;
            defaultComment.url = (option.path || location.pathname).replace(/index\.(html|htm)/, '');

        } catch (ex) {
            console.log(ex);
            let issue = 'https://github.com/ihoey/Hitalk/issues';
            if (_root.el) _root.nodata.show(`<pre style="color:red;text-align:left;">${ex}<br>Hitalk:<b>${_root.version}</b><br>反馈：${issue}</pre>`);
            else console && console.log(`%c${ex}\n%cHitalk%c${_root.version} ${issue}`, 'color:red;', 'background:#000;padding:5px;line-height:30px;color:#fff;', 'background:#456;line-height:30px;padding:5px;color:#fff;');
            return;
        }

        let _mark = _root.el.querySelector('.vmark');
        // alert
        _root.alert = {
            /**
             * {
             *  type:0/1,
             *  text:'',
             *  ctxt:'',
             *  otxt:'',
             *  cb:fn
             * }
             *
             * @param {Object} o
             */
            show(o) {
                _mark.innerHTML = `<div class="valert txt-center"><div class="vtext">${o.text}</div><div class="vbtns"></div></div>`;
                let _vbtns = _mark.querySelector('.vbtns');
                let _cBtn = `<button class="vcancel vbtn">${o && o.ctxt || '我再看看'}</button>`;
                let _oBtn = `<button class="vsure vbtn">${o && o.otxt || '继续提交'}</button>`;
                _vbtns.innerHTML = `${_cBtn}${o.type && _oBtn}`;
                _mark.querySelector('.vcancel').addEventListener('click', function (e) {
                    _root.alert.hide();
                });
                _mark.setAttribute('style', 'display:block;');
                if (o && o.type) {
                    let _ok = _mark.querySelector('.vsure');
                    Event.on('click', _ok, (e) => {
                        _root.alert.hide();
                        o.cb && o.cb();
                    });
                }
            },
            hide() {
                _mark.setAttribute('style', 'display:none;');
            }
        }

        // Bind Event
        _root.bind(option);
    }

    /**
     * Bind Event
     */
    bind(option) {
        let _root = this;
        let guest_info = (option.guest_info || GUEST_INFO).filter(item => GUEST_INFO.indexOf(item) > -1);

        let expandEvt = (el) => {
            if (el.offsetHeight > 180) {
                el.classList.add('expand');
                Event.on('click', el, (e) => {
                    el.setAttribute('class', 'vcontent');
                })
            }
        }

        let commonQuery = (url) => {
            let query = new _root.v.Query('Comment');
            query.equalTo('url', url || defaultComment['url']);
            query.descending('createdAt');
            return query;
        }

        var pageCount = document.querySelectorAll(".hitalk-comment-count");
        for (let i = 0; i < pageCount.length; i++) {
            let el = pageCount[i];
            let url = el.getAttribute('data-xid').replace(/index\.(html|htm)/, '');
            let cq = commonQuery(url);
            cq.find().then(res => {
                el.innerText = res.length;
            }).catch(ex => {
                //err(ex)
                el.innerText = 0;
            })
        }

        let query = (pageNo = 1) => {
            _root.loading.show();
            let cq = commonQuery();
            cq.limit('1000');
            cq.find().then(rets => {
                let len = rets.length;
                if (len) {
                    _root.el.querySelector('.vlist').innerHTML = '';
                    for (let i = 0; i < len; i++) {
                        insertDom(rets[i], !0)
                    }
                    _root.el.querySelector('.count').innerHTML = `评论(<span class="num">${len}</span>)`;
                }
                _root.loading.hide();
            }).catch(ex => {
                //err(ex)
                _root.loading.hide();
            })
        }
        query();

        let insertDom = (ret, mt) => {

            let _vcard = document.createElement('li');
            _vcard.setAttribute('class', 'vcard');
            _vcard.setAttribute('id', ret.id);
            let _ua = detect(ret.get("ua"))
            let _img = gravatar['hide'] ? '' : `<img class="vimg" src='${gravatar.cdn + md5(ret.get('mail') || ret.get('nick')) + gravatar.params}'>`;
            _vcard.innerHTML = `${_img}<section><div class="vhead"><a rel="nofollow" href="${getLink({ link: ret.get('link'), mail: ret.get('mail') })}" target="_blank" >${ret.get("nick")}</a>
            <span class="vsys">${_ua.os} ${_ua.osVersion}</span>
            <span class="vsys">${_ua.browser} ${_ua.version}</span>
            </div><div class="vcontent">${ret.get("comment")}</div><div class="vfooter"><span class="vtime">${timeAgo(ret.get("createdAt"))}</span><span rid='${ret.id}' at='@${ret.get('nick')}' mail='${ret.get('mail')}' class="vat">回复</span><div></section>`;
            let _vlist = _root.el.querySelector('.vlist');
            let _vlis = _vlist.querySelectorAll('li');
            let _vat = _vcard.querySelector('.vat');
            let _as = _vcard.querySelectorAll('a');
            for (let i = 0, len = _as.length; i < len; i++) {
                let item = _as[i];
                if (item && item.getAttribute('class') != 'at') {
                    item.setAttribute('target', '_blank');
                    item.setAttribute('rel', 'nofollow');
                }
            }
            if (mt) _vlist.appendChild(_vcard);
            else _vlist.insertBefore(_vcard, _vlis[0]);
            let _vcontent = _vcard.querySelector('.vcontent');
            expandEvt(_vcontent);
            bindAtEvt(_vat);

        }

        let mapping = {
            veditor: "comment"
        }
        for (let i = 0, length = guest_info.length; i < length; i++) {
            mapping[`v${guest_info[i]}`] = guest_info[i];
        }

        let inputs = {};
        for (let i in mapping) {
            if (mapping.hasOwnProperty(i)) {
                let _v = mapping[i];
                let _el = _root.el.querySelector(`.${i}`);
                inputs[_v] = _el;
                Event.on('input', _el, (e) => {
                    defaultComment[_v] = _v === 'comment' ? marked(_el.value, {
                        sanitize: !0
                    }) : HtmlUtil.encode(_el.value);
                });
            }
        }

        // cache
        let getCache = () => {
            let s = store && store.HitalkCache;
            if (s) {
                s = JSON.parse(s);
                let m = guest_info;
                for (let i in m) {
                    let k = m[i];
                    _root.el.querySelector(`.v${k}`).value = s[k];
                    defaultComment[k] = s[k];
                }
            }
        }
        getCache();



        let atData = {
            rmail: '',
            at: ''
        }

        // reset form
        let reset = () => {
            for (let i in mapping) {
                if (mapping.hasOwnProperty(i)) {
                    let _v = mapping[i];
                    let _el = _root.el.querySelector(`.${i}`);
                    _el.value = "";
                    defaultComment[_v] = "";
                }
            }
            atData['at'] = '';
            atData['rmail'] = '';
            defaultComment['rid'] = '';
            defaultComment['nick'] = 'Guest';
            getCache();
        }

        // submit
        let submitBtn = _root.el.querySelector('.vsubmit');
        let submitEvt = (e) => {
            if (submitBtn.getAttribute('disabled')) {
                _root.alert.show({
                    type: 0,
                    text: '再等等，评论正在提交中ヾ(๑╹◡╹)ﾉ"',
                    ctxt: '好的'
                })
                return;
            }
            if (defaultComment.comment == '') {
                inputs['comment'].focus();
                return;
            }
            if (defaultComment.nick == '') {
                defaultComment['nick'] = '小调皮';
            }
            let idx = defaultComment.comment.indexOf(atData.at);
            if (idx > -1 && atData.at != '') {
                let at = `<a class="at" href='#${defaultComment.rid}'>${atData.at}</a>`;
                defaultComment.comment = defaultComment.comment.replace(atData.at, at);
            }
            //表情
            var matched;
            while (matched = defaultComment.comment.match(pReg)) {
                defaultComment.comment = defaultComment.comment.replace(matched[0], `<img src="https://cdn.dode.top/newpaopao/${matched[1] + subfix}.png" class="biaoqing newpaopao" height=30 width=30 no-zoom />`);
            }
            while (matched = defaultComment.comment.match(aReg)) {
                defaultComment.comment = defaultComment.comment.replace(matched[0], `<img src="https://cdn.dode.top/alu/${matched[1] + subfix}.png" class="biaoqing alu" height=33 width=33 no-zoom />`);
            }

            // veirfy
            let mailRet = check.mail(defaultComment.mail);
            let linkRet = check.link(defaultComment.link);
            defaultComment['mail'] = mailRet.k ? mailRet.v : '';
            defaultComment['link'] = linkRet.k ? linkRet.v : '';
            if (!mailRet.k && !linkRet.k && guest_info.indexOf('mail') > -1 && guest_info.indexOf('link') > -1) {
                _root.alert.show({
                    type: 1,
                    text: '您的网址和邮箱格式不正确, 是否继续提交?',
                    cb() {
                        if (_root.notify || _root.verify) {
                            verifyEvt(commitEvt)
                        } else {
                            commitEvt();
                        }
                    }
                })
            } else if (!mailRet.k && guest_info.indexOf('mail') > -1) {
                _root.alert.show({
                    type: 1,
                    text: '您的邮箱格式不正确, 是否继续提交?',
                    cb() {
                        if (_root.notify || _root.verify) {
                            verifyEvt(commitEvt)
                        } else {
                            commitEvt();
                        }
                    }
                })
            } else if (!linkRet.k && guest_info.indexOf('link') > -1) {
                _root.alert.show({
                    type: 1,
                    text: '您的网址格式不正确, 是否继续提交?',
                    cb() {
                        if (_root.notify || _root.verify) {
                            verifyEvt(commitEvt)
                        } else {
                            commitEvt();
                        }
                    }
                })
            } else {
                if (_root.notify || _root.verify) {
                    verifyEvt(commitEvt)
                } else {
                    commitEvt();
                }
            }
        }

        // setting access
        let getAcl = () => {
            let acl = new _root.v.ACL();
            acl.setPublicReadAccess(!0);
            acl.setPublicWriteAccess(!1);
            return acl;
        }

        let commitEvt = () => {
            submitBtn.setAttribute('disabled', !0);
            _root.loading.show();
            // 声明类型
            let Ct = _root.v.Object.extend('Comment');
            // 新建对象
            let comment = new Ct();
            for (let i in defaultComment) {
                if (defaultComment.hasOwnProperty(i)) {
                    let _v = defaultComment[i];
                    comment.set(i, _v);
                }
            }
            comment.setACL(getAcl());
            comment.save().then((ret) => {
                defaultComment['nick'] != 'Guest' && store && store.setItem('HitalkCache', JSON.stringify({
                    nick: defaultComment['nick'],
                    link: defaultComment['link'],
                    mail: defaultComment['mail']
                }));
                let _count = _root.el.querySelector('.num');
                let num = 1;
                try {

                    if (_count) {
                        num = Number(_count.innerText) + 1;
                        _count.innerText = num;
                    } else {
                        _root.el.querySelector('.count').innerHTML = '评论(<span class="num">1</span>)'
                    }
                    insertDom(ret);

                    defaultComment['mail'] && signUp({
                        username: defaultComment['nick'],
                        mail: defaultComment['mail']
                    });

                    atData['at'] && atData['rmail'] && _root.notify && mailEvt({
                        username: atData['at'].replace('@', ''),
                        mail: atData['rmail']
                    });
                    submitBtn.removeAttribute('disabled');
                    _root.loading.hide();
                    reset();
                } catch (error) {
                    console.log(error)
                }
            }).catch(ex => {
                _root.loading.hide();
            })
        }

        let verifyEvt = (fn) => {
            let x = Math.floor((Math.random() * 10) + 1);
            let y = Math.floor((Math.random() * 10) + 1);
            let z = Math.floor((Math.random() * 10) + 1);
            let opt = ['+', '-', 'x'];
            let o1 = opt[Math.floor(Math.random() * 3)];
            let o2 = opt[Math.floor(Math.random() * 3)];
            let expre = `${x}${o1}${y}${o2}${z}`;
            let subject = `${expre} = <input class='vcode vinput' >`;
            _root.alert.show({
                type: 1,
                text: subject,
                ctxt: '取消',
                otxt: '确认',
                cb() {
                    let code = +_root.el.querySelector('.vcode').value;
                    let ret = (new Function(`return ${expre.replace(/x/g, '*')}`))();
                    if (ret === code) {
                        fn && fn();
                    } else {
                        _root.alert.show({
                            type: 1,
                            text: '(T＿T)这么简单都算错，也是没谁了',
                            ctxt: '伤心了，不回了',
                            otxt: '再试试?',
                            cb() {
                                verifyEvt(fn);
                                return;
                            }
                        })
                    }
                }
            })
        }

        let signUp = (o) => {
            let u = new _root.v.User();
            u.setUsername(o.username);
            u.setPassword(o.mail);
            u.setEmail(o.mail);
            u.setACL(getAcl());
            return u.signUp();
        }

        let mailEvt = (o) => {
            _root.v.User.requestPasswordReset(o.mail).then(ret => {}).catch(e => {
                if (e.code == 1) {
                    _root.alert.show({
                        type: 0,
                        text: `ヾ(ｏ･ω･)ﾉ At太频繁啦，提醒功能暂时宕机。<br>${e.error}`,
                        ctxt: '好的'
                    })
                } else {
                    signUp(o).then(ret => {
                        mailEvt(o);
                    }).catch(x => {
                        //err(x)
                    })
                }
            })
        }

        // at event
        let bindAtEvt = (el) => {
            Event.on('click', el, (e) => {
                let at = el.getAttribute('at');
                let rid = el.getAttribute('rid');
                let rmail = el.getAttribute('mail');
                atData['at'] = at;
                atData['rmail'] = rmail;
                defaultComment['rid'] = rid;
                inputs['comment'].value = `${at} `;
                inputs['comment'].focus();
            })
        }

        Event.off('click', submitBtn, submitEvt);
        Event.on('click', submitBtn, submitEvt);


    }

}

const Event = {
    on(type, el, handler, capture) {
        if (el.addEventListener) el.addEventListener(type, handler, capture || false);
        else if (el.attachEvent) el.attachEvent(`on${type}`, handler);
        else el[`on${type}`] = handler;
    },
    off(type, el, handler, capture) {
        if (el.removeEventListener) el.removeEventListener(type, handler, capture || false);
        else if (el.detachEvent) el.detachEvent(`on${type}`, handler);
        else el[`on${type}`] = null;
    }
}

const getLink = (target) => {
    return target.link || (target.mail && `mailto:${target.mail}`) || 'javascript:void(0);';
}

const check = {
    mail(m) {
        return {
            k: /[\w-\.]+@([\w-]+\.)+[a-z]{2,3}/.test(m),
            v: m
        };
    },
    link(l) {
        l = l.length > 0 && (/^(http|https)/.test(l) ? l : `http://${l}`);
        return {
            k: /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/.test(l),
            v: l
        };
    }
}

const HtmlUtil = {

    // /**
    //  *
    //  * 将str中的链接转换成a标签形式
    //  * @param {String} str
    //  * @returns
    //  */
    // transUrl(str) {
    //     let reg = /(http:\/\/|https:\/\/)((\w|=|\?|\.|\/|&|-)+)/g;
    //     return str.replace(reg, '<a target="_blank" href="$1$2">$1$2</a>');
    // },
    /**
     * HTML转码
     * @param {String} str
     * @return {String} result
     */
    encode(str) {
        return !!str ? str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/ /g, "&nbsp;").replace(/\'/g, "&#39;").replace(/\"/g, "&quot;") : '';
    },
    /**
     * HTML解码
     * @param {String} str
     * @return {String} result
     */
    decode(str) {
        return !!str ? str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&#39;/g, "\'").replace(/&quot;/g, "\"") : '';
    }
};

const dateFormat = (date) => {
    var vDay = padWithZeros(date.getDate(), 2);
    var vMonth = padWithZeros(date.getMonth() + 1, 2);
    var vYear = padWithZeros(date.getFullYear(), 2);
    // var vHour = padWithZeros(date.getHours(), 2);
    // var vMinute = padWithZeros(date.getMinutes(), 2);
    // var vSecond = padWithZeros(date.getSeconds(), 2);
    return `${vYear}-${vMonth}-${vDay}`;
}

const timeAgo = (date) => {
    try {
        var oldTime = date.getTime();
        var currTime = new Date().getTime();
        var diffValue = currTime - oldTime;

        var days = Math.floor(diffValue / (24 * 3600 * 1000));
        if (days === 0) {
            //计算相差小时数
            var leave1 = diffValue % (24 * 3600 * 1000); //计算天数后剩余的毫秒数
            var hours = Math.floor(leave1 / (3600 * 1000));
            if (hours === 0) {
                //计算相差分钟数
                var leave2 = leave1 % (3600 * 1000); //计算小时数后剩余的毫秒数
                var minutes = Math.floor(leave2 / (60 * 1000));
                if (minutes === 0) {
                    //计算相差秒数
                    var leave3 = leave2 % (60 * 1000); //计算分钟数后剩余的毫秒数
                    var seconds = Math.round(leave3 / 1000);
                    return seconds + ' 秒前';
                }
                return minutes + ' 分钟前';
            }
            return hours + ' 小时前';
        }
        if (days < 0) return '刚刚';

        if (days < 8) {
            return days + ' 天前';
        } else {
            return dateFormat(date)
        }
    } catch (error) {
        console.log(error)
    }


}

const padWithZeros = (vNumber, width) => {
    var numAsString = vNumber.toString();
    while (numAsString.length < width) {
        numAsString = '0' + numAsString;
    }
    return numAsString;
}

module.exports = Hitalk;
