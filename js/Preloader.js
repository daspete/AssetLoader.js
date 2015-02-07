/////////////////////////////////////////////////////////////////////////////
// Preloader Module
// (c) 2014 by Das PeTe
//////////////////////////////////////////////////////////////////////////




if (typeof console === 'undefined' || typeof console.log === 'undefined') {
    console = {
        log: function(o){},
        dir: function(o){}
    };
}

log = function(o){ console.log(o); };
dir = function(o){ console.dir(o); };





// UMD PATTERN
(function (root, factory) {
    if (typeof define === "function" && define.amd) { // AMD ready
        define([
            'jquery', 
            'backbone'
        ], factory);
    }else if(typeof exports === 'object'){ // nodejs
        module.exports=factory(
            require('jquery'), 
            require('underscore'
        ));
    }else{ // NO-AMD
        root.Preloader=factory(
            root.$, 
            root._
        );
    }
}(this, function (
    $,
    _
){
// END UMD PATTERN
    // Preloader Constructor
    function Preloader(settings){
        
        // default settings
        var defaults={
            auto: true, // load on instantiation

            minLoadTime: 1, // seconds

            container: 'body',

            imageHolderClass: 'imagePreloaderHolder',
            
            images: [], // images to load
            audios: [], // audios to load
            
            onImageLoadError: function(){},
            onAudioLoadError: function(){},

            onImageLoadSuccess: function(){},
            onAudioLoadSuccess: function(){},

            onImagesComplete: function(){},
            onAudiosComplete: function(){},
            
            onComplete: function(){}
        };
        
        // Preloader MainModule
        var preloader={
            
            settings: {},

            environment: {},

            DOM: {},

            images: [],
            audios: [],

            imagesLoaded: false,
            audiosLoaded: false,
            
            init: function(settings, defaults){
                _.bindAll.apply(_, [this].concat(_.functions(this)));

                $.extend(this.settings, defaults, settings);

                this.getEnvironment();
                this.setup();
            },

            setup: function(){
                this.initDOM();

                if(this.settings.auto === true){
                    this.loadAll();    
                }
            },

            initDOM: function(){
                this.DOM.$container=$(this.settings.container);
            },


            loadAll: function(){
                this.loadImages();
                this.loadAudios();
            },

            loadImages: function(){
                if(this.settings.images.length === 0){
                    this.onImagesLoaded();

                    return;
                }

                this.loadImage(0);
            },

            loadImage: function(index){
                var that=this;

                if(index >= this.settings.images.length){
                    return;
                }

                var image=new Image();
                image._loadindex=index;
                image.onload=function(e){
                    that.images[e.target._loadindex]=e.target;
                    that.settings.onImageLoadSuccess(e.target);
                    that.addImageToDOM(e.target);
                    that.loadImage(e.target._loadindex+1);
                    that.checkAllImagesComplete();
                };
                image.onerror=function(e){
                    that.images[e.target._loadindex]=null;
                    that.settings.onImageLoadError(e.target);
                    that.loadImage(e.target._loadindex+1);
                    that.checkAllImagesComplete();
                }
                image.src=this.settings.images[index];
            },

            checkAllImagesComplete: function(index){
                if(this.images.length === this.settings.images.length){
                    this.onImagesLoaded();
                }
            },

            addImageToDOM: function(image){
                if(typeof this.DOM.$imageHolder === 'undefined'){
                    this.setImagePreloaderHolder();
                }

                this.DOM.$imageHolder.append(image);
                $(image).css({
                    backgroundImage: 'url('+image.src+')',
                });
            },

            setImagePreloaderHolder: function(){
                var $imageHolder=$('<div>');
                $imageHolder.css({
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    overflow: 'hidden',
                    width: 0,
                    height: 0
                });
                $imageHolder.addClass(this.settings.imageHolderClass);
                this.DOM.$container.append($imageHolder);
                this.DOM.$imageHolder=$imageHolder;
            },

            onImagesLoaded: function(){
                this.imagesLoaded=true;

                this.settings.onImagesComplete();
                this.checkAllComplete();
            },

            loadAudios: function(){
                if(this.settings.audios.length === 0){
                    this.audiosLoaded=true;
                    this.settings.onAudiosComplete();
                    this.checkAllComplete();

                    return;
                }

                this.loadAudio(0);
            },

            loadAudio: function(index){
                var that=this;

                if(index >= this.settings.audios.length){
                    return;
                }

                var audio=new Audio();
                audio._loadindex=index;
                audio.src=this.settings.audios[index];
                audio.addEventListener('error', function(e){
                    that.audios[e.target._loadindex]=null;
                    that.settings.onAudioLoadError(e.target);
                    that.loadAudio(e.target._loadindex+1);
                    that.checkAllAudiosComplete();
                });
                audio.addEventListener('canplaythrough', function(e){
                    that.audios[e.target._loadindex]=e.target;
                    that.settings.onAudioLoadSuccess(e.target);
                    that.loadAudio(e.target._loadindex+1);
                    that.checkAllAudiosComplete();
                });
                audio.load();
            },

            checkAllAudiosComplete: function(index){
                if(this.audios.length === this.settings.audios.length){
                    this.onAudiosLoaded();
                }
            },


            onAudiosLoaded: function(){
                this.audiosLoaded=true;

                this.settings.onAudiosComplete();
                this.checkAllComplete();
            },

            checkAllComplete: function(){
                if(this.imagesLoaded === true && this.audiosLoaded === true){
                    this.settings.onComplete({
                        images: this.images,
                        audios: this.audios
                    });
                }
            },


            getEnvironment: function(){
                this.environment=this.getBrowser();
                this.environment.prefix=this.getPrefix();
            },

            getPrefix: function(){
                var styles = window.getComputedStyle(document.documentElement, ''),
                    pre = (Array.prototype.slice
                                .call(styles)
                                .join('') 
                                .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
                    )[1],
                    dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
                
                return {
                    dom: dom,
                    lowercase: pre,
                    css: '-' + pre + '-',
                    js: pre[0].toUpperCase() + pre.substr(1)
                };
            },

            getBrowser: function(){
                var ua= navigator.userAgent, tem, 
                M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
                if(/trident/i.test(M[1])){
                    tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
                    return{
                        browser: 'IE',
                        version: tem[1] || ''
                    };
                }
                if(M[1]=== 'Chrome'){
                    tem= ua.match(/\bOPR\/(\d+)/);
                    if(tem!= null) 
                        return {
                            browser: 'Opera',
                            version: tem[1]
                        };
                }
                M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
                if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);

                return {
                    browser: M[0],
                    version: M[1]
                };
            }

        };
        // END PRELOADER MainModule
        
        // Initialize PRELOADER
        if(typeof settings === "undefined"){
            settings=defaults;
        }

        preloader.init(settings, defaults);
        
        return preloader;
    }

    return Preloader;
}));