/*!
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved 
 *  Use of this code requires a commercial software license with ForgeRock AS. or with one of its affiliates. All use shall be exclusively subject to such license between the licensee and ForgeRock AS.
 */
(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-766457e9"],{"13bf":function(e,t,a){"use strict";var n=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("b-container",{staticClass:"px-0 h-100 d-flex",attrs:{fluid:""}},[n("div",{staticClass:"fr-m-auto fr-center-card align-self-center"},[n("b-card",{staticClass:"border-xs-0 border-sm d-flex fr-stretch-card",attrs:{"no-body":"","header-tag":"header","footer-tag":"footer"}},[n("b-card-header",{staticClass:"d-flex align-items-center flex-fill"},[n("div",{staticClass:"d-flex flex-fill flex-column justify-content-center"},[e.showLogo?n("b-img",{staticClass:"fr-logo mb-3 mt-2",attrs:{src:a("4acf"),fluid:"",alt:e.$t("common.form.logo")}}):e._e(),e._t("center-card-header")],2)]),e._t("center-card-body"),e._t("center-card-footer")],2)],1)])},i=[],l={name:"Center-Card",props:{showLogo:{type:Boolean,default:!1}}},o=l,s=(a("ae7a"),a("2877")),r=Object(s["a"])(o,n,i,!1,null,"06bae7dd",null);t["a"]=r.exports},"49c6":function(e,t,a){"use strict";var n=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"mb-3"},[a("ValidationProvider",{attrs:{rules:e.validateRules,vid:e.id,name:e.label},scopedSlots:e._u([{key:"default",fn:function(t){return[a("div",{ref:"floatingLabelGroup",class:[{"form-label-password":e.reveal},"form-label-group","mb-0"]},["checkbox"===e.inputType?a("input",{directives:[{name:"model",rawName:"v-model",value:e.inputValue,expression:"inputValue"}],ref:"input",class:[{polyfillPlaceholder:e.floatLabels,"is-invalid":t.errors.length>0&&e.showErrorState},"form-control"],attrs:{id:e.id,autofocus:e.autofocus,placeholder:e.label,name:e.fieldName,type:"checkbox"},domProps:{checked:Array.isArray(e.inputValue)?e._i(e.inputValue,null)>-1:e.inputValue},on:{change:function(t){var a=e.inputValue,n=t.target,i=!!n.checked;if(Array.isArray(a)){var l=null,o=e._i(a,l);n.checked?o<0&&(e.inputValue=a.concat([l])):o>-1&&(e.inputValue=a.slice(0,o).concat(a.slice(o+1)))}else e.inputValue=i}}}):"radio"===e.inputType?a("input",{directives:[{name:"model",rawName:"v-model",value:e.inputValue,expression:"inputValue"}],ref:"input",class:[{polyfillPlaceholder:e.floatLabels,"is-invalid":t.errors.length>0&&e.showErrorState},"form-control"],attrs:{id:e.id,autofocus:e.autofocus,placeholder:e.label,name:e.fieldName,type:"radio"},domProps:{checked:e._q(e.inputValue,null)},on:{change:function(t){e.inputValue=null}}}):a("input",{directives:[{name:"model",rawName:"v-model",value:e.inputValue,expression:"inputValue"}],ref:"input",class:[{polyfillPlaceholder:e.floatLabels,"is-invalid":t.errors.length>0&&e.showErrorState},"form-control"],attrs:{id:e.id,autofocus:e.autofocus,placeholder:e.label,name:e.fieldName,type:e.inputType},domProps:{value:e.inputValue},on:{input:function(t){t.target.composing||(e.inputValue=t.target.value)}}}),e.reveal?a("div",{staticClass:"input-group-append"},[a("button",{staticClass:"btn btn-secondary",attrs:{type:"button"},on:{click:e.revealText}},[a("i",{class:[{"fa-eye-slash":!e.show},{"fa-eye":e.show},"fa"]})])]):e._e(),a("label",{attrs:{hidden:e.hideLabel,for:e.id}},[e._v(e._s(e.label))])]),e._t("validationError",[a("p",{staticClass:"text-danger"},[e._v(e._s(t.errors[0]))])])]}}],null,!0)})],1)},i=[],l=a("2ef0"),o=a.n(l),s={name:"Floating-Label-Input",components:{},props:{label:String,type:String,autofocus:String,fieldName:String,validateRules:{type:[String,Object]},reveal:Boolean,showErrorState:{type:Boolean,default:!0},defaultValue:{required:!1},value:{type:String,default:function(){return""}}},data:function(){return{inputValue:this.value,id:null,floatLabels:!1,hideLabel:!0,inputType:this.type,show:!0}},beforeMount:function(){this.id="floatingLabelInput"+this._uid},mounted:function(){var e=this;o.a.delay(o.a.bind((function(){navigator.userAgent.indexOf("Edge")>=0?document.getElementById("".concat(e.id)).value.length&&(e.floatLabels=!0,e.inputValue=document.getElementById("".concat(e.id)).value):navigator.userAgent.indexOf("Chrome")>=0&&document.querySelectorAll("#".concat(e.id,":-webkit-autofill")).length>0&&(e.floatLabels=!0),e.hideLabel=!1}),this),400),this.defaultValue&&(this.inputValue=this.defaultValue),"true"===this.autofocus&&this.$refs.input.focus()},methods:{revealText:function(){"password"===this.inputType?(this.inputType="text",this.show=!1):(this.inputType="password",this.show=!0)}},watch:{inputValue:function(e){this.floatLabels=e.length>0,this.$emit("input",e)},value:function(){this.inputValue=this.value}}},r=s,u=(a("bdad"),a("2877")),c=Object(u["a"])(r,n,i,!1,null,"43c8fc8c",null);t["a"]=c.exports},"4acf":function(e,t,a){e.exports=a.p+"img/vertical-logo.fac466b9.svg"},a906:function(e,t,a){},ae7a:function(e,t,a){"use strict";var n=a("a906"),i=a.n(n);i.a},b107:function(e,t,a){e.exports={baseColor:"#007bff"}},bdad:function(e,t,a){"use strict";var n=a("c152"),i=a.n(n);i.a},c152:function(e,t,a){},e5d2:function(e,t,a){"use strict";var n,i,l=a("2ef0"),o=a.n(l),s={name:"Selfservice-API",methods:{loadData:function(){var e=this,t=this.getRequestService({headers:this.getAnonymousHeaders()});t.get("/selfservice/".concat(this.apiType)).then((function(t){e.setChildComponent(t.data.type,t.data)})).catch((function(t){o.a.has(e.$router.currentRoute,"params.profileProcess")?e.$router.push("/login"):e.displayNotification("error",t.response.data.message)}))},advanceStage:function(e,t){var a=this,n=this.getAnonymousHeaders();t&&(n={"X-OpenIDM-NoSession":!1,"X-OpenIDM-Password":null,"X-OpenIDM-Username":null});var i=this.getRequestService({headers:o.a.extend(n,{"X-Requested-With":"XMLHttpRequest"})}),l={input:{}};this.selfServiceDetails&&this.selfServiceDetails.token&&(l.token=this.selfServiceDetails.token),e.token&&e.code&&(l.token=e.token),l.input=e,this.showSelfService&&(this.showSelfService=!1),i.post("/selfservice/".concat(this.apiType,"?_action=submitRequirements"),l).then((function(e){a.setChildComponent(e.data.type,e.data)})).catch((function(e){o.a.isUndefined(a.apiErrorCallback)||a.apiErrorCallback(e)}))},parseQueryParams:function(e){return e.match("returnParams")?{returnParams:o.a.last(decodeURIComponent(e).split("returnParams="))}:JSON.parse("{\n                            ".concat(decodeURI('"'+e.slice(1).replace(/&/g,'","').replace(/=/g,'":"'))+'"',"\n                        }"))}}},r=s,u=a("2877"),c=Object(u["a"])(r,n,i,!1,null,null,null);t["a"]=c.exports}}]);
//# sourceMappingURL=chunk-766457e9.5cb80f6d.js.map