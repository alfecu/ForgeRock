/*!
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved 
 *  Use of this code requires a commercial software license with ForgeRock AS. or with one of its affiliates. All use shall be exclusively subject to such license between the licensee and ForgeRock AS.
 */
(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-533b2867"],{"20f7":function(e,t,s){"use strict";var i=s("ca3e"),a=s.n(i);a.a},"31da":function(e,t,s){"use strict";var i=s("da55"),a=s.n(i);a.a},"49c6":function(e,t,s){"use strict";var i=function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("div",{staticClass:"mb-3"},[s("ValidationProvider",{attrs:{rules:e.validateRules,vid:e.id,name:e.label},scopedSlots:e._u([{key:"default",fn:function(t){return[s("div",{ref:"floatingLabelGroup",class:[{"form-label-password":e.reveal},"form-label-group","mb-0"]},["checkbox"===e.inputType?s("input",{directives:[{name:"model",rawName:"v-model",value:e.inputValue,expression:"inputValue"}],ref:"input",class:[{polyfillPlaceholder:e.floatLabels,"is-invalid":t.errors.length>0&&e.showErrorState},"form-control"],attrs:{id:e.id,autofocus:e.autofocus,placeholder:e.label,name:e.fieldName,type:"checkbox"},domProps:{checked:Array.isArray(e.inputValue)?e._i(e.inputValue,null)>-1:e.inputValue},on:{change:function(t){var s=e.inputValue,i=t.target,a=!!i.checked;if(Array.isArray(s)){var n=null,o=e._i(s,n);i.checked?o<0&&(e.inputValue=s.concat([n])):o>-1&&(e.inputValue=s.slice(0,o).concat(s.slice(o+1)))}else e.inputValue=a}}}):"radio"===e.inputType?s("input",{directives:[{name:"model",rawName:"v-model",value:e.inputValue,expression:"inputValue"}],ref:"input",class:[{polyfillPlaceholder:e.floatLabels,"is-invalid":t.errors.length>0&&e.showErrorState},"form-control"],attrs:{id:e.id,autofocus:e.autofocus,placeholder:e.label,name:e.fieldName,type:"radio"},domProps:{checked:e._q(e.inputValue,null)},on:{change:function(t){e.inputValue=null}}}):s("input",{directives:[{name:"model",rawName:"v-model",value:e.inputValue,expression:"inputValue"}],ref:"input",class:[{polyfillPlaceholder:e.floatLabels,"is-invalid":t.errors.length>0&&e.showErrorState},"form-control"],attrs:{id:e.id,autofocus:e.autofocus,placeholder:e.label,name:e.fieldName,type:e.inputType},domProps:{value:e.inputValue},on:{input:function(t){t.target.composing||(e.inputValue=t.target.value)}}}),e.reveal?s("div",{staticClass:"input-group-append"},[s("button",{staticClass:"btn btn-secondary",attrs:{type:"button"},on:{click:e.revealText}},[s("i",{class:[{"fa-eye-slash":!e.show},{"fa-eye":e.show},"fa"]})])]):e._e(),s("label",{attrs:{hidden:e.hideLabel,for:e.id}},[e._v(e._s(e.label))])]),e._t("validationError",[s("p",{staticClass:"text-danger"},[e._v(e._s(t.errors[0]))])])]}}],null,!0)})],1)},a=[],n=s("2ef0"),o=s.n(n),l={name:"Floating-Label-Input",components:{},props:{label:String,type:String,autofocus:String,fieldName:String,validateRules:{type:[String,Object]},reveal:Boolean,showErrorState:{type:Boolean,default:!0},defaultValue:{required:!1},value:{type:String,default:function(){return""}}},data:function(){return{inputValue:this.value,id:null,floatLabels:!1,hideLabel:!0,inputType:this.type,show:!0}},beforeMount:function(){this.id="floatingLabelInput"+this._uid},mounted:function(){var e=this;o.a.delay(o.a.bind((function(){navigator.userAgent.indexOf("Edge")>=0?document.getElementById("".concat(e.id)).value.length&&(e.floatLabels=!0,e.inputValue=document.getElementById("".concat(e.id)).value):navigator.userAgent.indexOf("Chrome")>=0&&document.querySelectorAll("#".concat(e.id,":-webkit-autofill")).length>0&&(e.floatLabels=!0),e.hideLabel=!1}),this),400),this.defaultValue&&(this.inputValue=this.defaultValue),"true"===this.autofocus&&this.$refs.input.focus()},methods:{revealText:function(){"password"===this.inputType?(this.inputType="text",this.show=!1):(this.inputType="password",this.show=!0)}},watch:{inputValue:function(e){this.floatLabels=e.length>0,this.$emit("input",e)},value:function(){this.inputValue=this.value}}},r=l,c=(s("bdad"),s("2877")),u=Object(c["a"])(r,i,a,!1,null,"43c8fc8c",null);t["a"]=u.exports},5231:function(e,t,s){"use strict";var i=function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("b-card",{staticClass:"mb-3",attrs:{"no-body":""}},[e._t("list-group-header",[s("b-card-body",{staticClass:"py-4"},[s("h5",{class:[{"mb-4":e.subtitle,"mb-0":!e.subtitle},"card-title"]},[e._v(e._s(e.title))]),e.subtitle?s("h6",{staticClass:"card-subtitle mb-0 text-muted"},[e._v(e._s(e.subtitle))]):e._e()])]),s("b-list-group",{attrs:{flush:""}},[e._t("default")],2)],2)},a=[],n={name:"List-Group",props:{title:{type:String},subtitle:{type:String}},data:function(){return{}}},o=n,l=(s("31da"),s("2877")),r=Object(l["a"])(o,i,a,!1,null,"9e56b7f4",null);t["a"]=r.exports},"56a3":function(e,t,s){"use strict";var i=s("7a6d"),a=s.n(i);a.a},"787a":function(e,t,s){"use strict";var i=function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("button",{class:["btn btn-primary d-flex align-items-center",{disabled:e.loading}],attrs:{type:"button"},on:{click:function(t){return e.$emit("click")}}},[s("span",{class:[{"align-self-start":!e.large,"m-auto":e.large}]},[e._v(" "+e._s(e.label)+" ")]),s("span",{class:["fr-grow",{"fr-grow-in":e.loading}]},[s("transition",{attrs:{name:"fr-fade"}},[e.loading?s("clip-loader",{staticClass:"position-relative fr-clip-loader ml-3",attrs:{color:"white",size:"1rem"}}):e._e()],1)],1)])},a=[],n=s("8455"),o={name:"LoadingButton",components:{ClipLoader:n["ClipLoader"]},props:{label:String,loading:{type:Boolean,default:!1},large:{type:Boolean,default:!1}}},l=o,r=(s("20f7"),s("2877")),c=Object(r["a"])(l,i,a,!1,null,"18109016",null);t["a"]=c.exports},"7a6d":function(e,t,s){},8960:function(e,t,s){"use strict";s.r(t);var i=function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("fr-list-group",{attrs:{title:e.$t("pages.profile.accountSecurity.title"),subtitle:e.$t("pages.profile.accountSecurity.subtitle")}},[s("fr-edit-password",{on:{updateProfile:e.sendUpdateProfile}}),e.isOnKBA&&!1===e.$root.userStore.state.internalUser?s("fr-edit-kba",{attrs:{kbaData:e.kbaData},on:{updateKBA:e.sendUpdateKBA}}):e._e()],1)},a=[],n=function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("fr-list-item",{attrs:{collapsible:!0,panelShown:!1},on:{show:function(t){e.showCancelButton=!0},hide:function(t){e.showCancelButton=!0,e.clearComponent()}}},[s("div",{staticClass:"d-inline-flex w-100 media",attrs:{slot:"list-item-header"},slot:"list-item-header"},[s("div",{staticClass:"media-body align-self-center"},[s("h6",{staticClass:"mt-2"},[e._v(e._s(e.$t("pages.profile.accountSecurity.securityQuestions")))])]),s("div",{staticClass:"d-flex ml-3 align-self-center"},[s("div",{directives:[{name:"show",rawName:"v-show",value:e.showCancelButton,expression:"showCancelButton"}],ref:"cancel",staticClass:"btn btn-sm btn-link float-right btn-cancel p-0"},[e._v(e._s(e.$t("common.form.cancel")))])])]),e.selected.length?s("div",{staticClass:"d-inline-flex w-100",attrs:{slot:"list-item-collapse-body"},slot:"list-item-collapse-body"},[s("ValidationObserver",{ref:"observer",attrs:{slim:""}},[s("b-form",{staticClass:"w-100"},[s("b-row",[s("b-col",{attrs:{sm:"8"}},[e._l(e.selected,(function(t,i){return s("fieldset",{key:"kba-question-body-"+i,staticClass:"pb-3"},[s("label",[e._v(e._s(e.$t("common.user.kba.question"))+" "+e._s(t.index))]),s("b-form-select",{staticClass:"mb-3",attrs:{options:e.selectOptions},model:{value:t.selected,callback:function(s){e.$set(t,"selected",s)},expression:"select.selected"}}),s("b-form-group",[t&&t.selected===e.customIndex?s("ValidationProvider",{staticClass:"pb-3",attrs:{rules:"required",name:e.$t("pages.profile.accountSecurity.custom")+" "+t.index},scopedSlots:e._u([{key:"default",fn:function(i){return[s("label",{attrs:{for:"fr-kba-custom-question"+t.index}},[e._v(e._s(e.$t("pages.profile.accountSecurity.custom")))]),s("b-form-input",{attrs:{type:"text",id:"fr-kba-custom-question"+t.index,state:e.getValidationState(i),name:"fr-kba-custom-question"+t.index},model:{value:t.custom,callback:function(s){e.$set(t,"custom","string"===typeof s?s.trim():s)},expression:"select.custom"}}),s("b-form-invalid-feedback",{attrs:{id:"fr-kba-common-feedback"+t.index}},[e._v(e._s(i.errors[0]))])]}}],null,!0)}):e._e()],1),s("b-form-group",{staticClass:"mb-0"},[s("ValidationProvider",{attrs:{rules:"required",name:e.$t("common.user.kba.answer")+" "+t.index},scopedSlots:e._u([{key:"default",fn:function(i){return[s("label",{attrs:{for:"fr-kba-common-question"+t.index}},[e._v(e._s(e.$t("common.user.kba.answer")))]),s("b-form-input",{attrs:{id:"fr-kba-common-question"+t.index,type:"text",state:e.getValidationState(i),name:"fr-kba-common-question"+t.index},model:{value:t.answer,callback:function(s){e.$set(t,"answer","string"===typeof s?s.trim():s)},expression:"select.answer"}}),s("b-form-invalid-feedback",{attrs:{id:"fr-kba-common-feedback"+t.index}},[e._v(e._s(i.errors[0]))])]}}],null,!0)})],1),i!==e.selected.length-1?s("hr",{staticClass:"mb-3 mt-4"}):e._e()],1)})),s("fr-loading-button",{staticClass:"ld-ext-right mb-3",attrs:{type:"button",variant:"primary",label:e.$t("common.user.kba.saveQuestions"),loading:e.loading},on:{click:e.onSaveKBA}})],2)],1)],1)],1)],1):e._e()])},o=[],l=s("2ef0"),r=s.n(l),c=s("9830"),u=s("787a"),d={name:"Edit-KBA",components:{"fr-list-item":c["a"],"fr-loading-button":u["a"]},props:["kbaData"],data:function(){return{questions:{},selectOptions:[],selected:[],customIndex:null,loading:!1,showCancelButton:!1}},created:function(){this.questions=this.kbaData.questions,this.initializeForm(this.kbaData.minimumAnswersToDefine)},methods:{initializeForm:function(e){var t=this,s=this.$i18n,i=s.locale,a=s.fallbackLocale;r.a.times(e,(function(e){t.selected.push({selected:null,index:e+1,answer:"",custom:""})})),this.selectOptions=r.a.map(this.questions,(function(e,t){return{value:t,text:e[i]||e[a],disabled:!0}})),this.customIndex=this.selectOptions.length+1,this.selectOptions.unshift({value:null,text:this.$t("common.user.kba.selectQuestion"),disabled:!0}),this.selectOptions.push({value:this.customIndex,text:this.$t("common.user.kba.custom"),disabled:!1})},generatePatch:function(){var e=r.a.map(this.selected,(function(e){return e.custom?{answer:e.answer,customQuestion:e.custom}:{answer:e.answer,questionId:e.selected}}));return[{operation:"replace",field:"/kbaInfo",value:e}]},clearComponent:function(){this.loading=!1,this.questions={},this.selectOptions=[],this.selected=[],this.customIndex=null,this.showCancelButton=!1,this.questions=this.kbaData.questions,this.initializeForm(this.kbaData.minimumAnswersToDefine),this.$refs.observer.reset()},onSaveKBA:function(){var e=this;this.$refs.observer.validate().then((function(t){t&&(e.loading=!0,e.$emit("updateKBA",e.generatePatch(),{onSuccess:function(){e.$refs.cancel.click()}}))}))}},watch:{selected:{handler:function(e){var t=this,s=r.a.map(this.selected,(function(e){if(null!==e.selected&&e.selected!==t.customIndex)return e.selected}));r.a.each(this.selectOptions,(function(e){r.a.includes(s,e.value)||null===e.value?e.disabled=!0:e.disabled=!1}))},deep:!0},kbaData:{deep:!0,handler:r.a.noop}}},p=d,f=s("2877"),m=Object(f["a"])(p,n,o,!1,null,null,null),h=m.exports,b=function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("fr-list-item",{attrs:{collapsible:!0,panelShown:!1},on:{show:function(t){e.showCancelButton=!0},hide:function(t){e.showCancelButton=!0,e.clearComponent()}}},[e._v("> "),s("div",{staticClass:"d-inline-flex w-100 media",attrs:{slot:"list-item-header"},slot:"list-item-header"},[s("div",{staticClass:"media-body align-self-center"},[s("h6",{staticClass:"mt-2"},[e._v(e._s(e.$t("pages.profile.accountSecurity.password")))])]),s("div",{staticClass:"d-flex ml-3 align-self-center"},[s("div",{directives:[{name:"show",rawName:"v-show",value:e.showCancelButton,expression:"showCancelButton"}],ref:"cancel",staticClass:"btn btn-sm btn-link float-right btn-cancel p-0"},[e._v(e._s(e.$t("common.form.cancel")))])])]),s("div",{staticClass:"d-inline-flex w-100",attrs:{slot:"list-item-collapse-body"},slot:"list-item-collapse-body"},[s("b-form",{staticClass:"w-100"},[s("b-row",[s("b-col",{attrs:{sm:"8"}},[s("b-form-group",[s("fr-floating-label-input",{attrs:{name:"currentPassword",fieldName:"currentPassword",type:"password",label:e.$t("pages.profile.accountSecurity.currentPassword"),reveal:!0,showErrorState:!1},model:{value:e.currentPassword,callback:function(t){e.currentPassword=t},expression:"currentPassword"}})],1),s("fr-password-policy-input",{attrs:{policyApi:this.$root.userStore.state.managedResource+"/"+e.userId},model:{value:e.newPassword,callback:function(t){e.newPassword=t},expression:"newPassword"}}),s("fr-loading-button",{staticClass:"ld-ext-right mb-3",attrs:{type:"button",variant:"primary",label:e.$t("pages.profile.accountSecurity.savePassword"),loading:e.loading},on:{click:e.onSavePassword}}),this.$root.applicationStore.state.passwordReset?s("div",{staticClass:"text-nowrap pb-2"},[e._v(e._s(e.$t("pages.profile.accountSecurity.rememberPassword"))+" "),s("router-link",{attrs:{to:"PasswordReset"}},[e._v(e._s(e.$t("pages.profile.accountSecurity.resetPassword")))])],1):e._e()],1)],1)],1)],1)])},v=[],w=s("f8f2"),y=s("49c6"),g={name:"Edit-Password",components:{"fr-list-item":c["a"],"fr-floating-label-input":y["a"],"fr-loading-button":u["a"],"fr-password-policy-input":w["a"]},data:function(){return{currentPassword:"",newPassword:"",loading:!1,showNew:!0,showCurrent:!0,inputCurrent:"password",inputNew:"password",userId:this.$root.userStore.getUserState().userId,showCancelButton:!1}},methods:{clearComponent:function(){this.currentPassword="",this.newPassword="",this.showCancelButton=!1},resetComponent:function(){this.loading=!1,this.currentPassword="",this.newPassword="",this.$refs.cancel.click()},onSavePassword:function(){var e={"X-Requested-With":"XMLHttpRequest","X-OpenIDM-Reauth-Password":this.encodeRFC5987IfNecessary(this.currentPassword)},t=[{operation:"add",field:"/password",value:this.newPassword}],s=this.resetComponent.bind(this);this.$emit("updateProfile",t,{headers:e,onSuccess:s,noop:l["noop"]})},revealNew:function(){"password"===this.inputNew?(this.inputNew="text",this.showNew=!1):(this.inputNew="password",this.showNew=!0)},revealCurrent:function(){"password"===this.inputCurrent?(this.inputCurrent="text",this.showCurrent=!1):(this.inputCurrent="password",this.showCurrent=!0)}}},_=g,C=Object(f["a"])(_,b,v,!1,null,null,null),x=C.exports,k=s("5231"),P={name:"Account-Security",data:function(){return{isOnKBA:!1,kbaData:{}}},components:{"fr-list-group":k["a"],"fr-edit-kba":h,"fr-edit-password":x},methods:{sendUpdateKBA:function(e,t){this.$emit("updateKBA",e,t)},sendUpdateProfile:function(e,t){this.$emit("updateProfile",e,t)}},mounted:function(){var e=this,t=this.getRequestService({headers:this.getAnonymousHeaders()});t.get("selfservice/kba").then((function(t){e.isOnKBA=!0,e.kbaData=t.data})).catch((function(){e.isOnKBA=!1}))}},S=P,$=Object(f["a"])(S,i,a,!1,null,null,null);t["default"]=$.exports},9830:function(e,t,s){"use strict";var i=function(){var e=this,t=e.$createElement,s=e._self._c||t;return e.collapsible?s("div",{staticClass:"collapsible"},[s("b-list-group-item",{directives:[{name:"b-toggle",rawName:"v-b-toggle",value:e.toggleId,expression:"toggleId"}],class:[{"list-item-cursor":!1===e.collapsible}],attrs:{href:"#"}},[s("div",{staticClass:"media"},[e._t("list-item-header")],2)]),s("b-collapse",{attrs:{id:e.id,visible:e.panelShown},on:{hide:function(t){return e.$emit("hide")},show:function(t){return e.$emit("show")},hidden:function(t){return e.$emit("hidden")},shown:function(t){return e.$emit("shown")}}},[s("b-card-body",{staticClass:"pt-3"},[e._t("list-item-collapse-body")],2)],1)],1):s("div",{class:[{"fr-hover-item":e.hoverItem}],on:{click:function(t){return e.$emit("row-click")}}},[s("b-list-group-item",{staticClass:"noncollapse"},[s("div",{staticClass:"media"},[e._t("list-item-header")],2)]),e.panelShown?s("b-card-body",{staticClass:"pt-3"},[e._t("list-item-collapse-body")],2):e._e()],1)},a=[],n={name:"List-Item",props:{collapsible:{type:Boolean,default:!1},panelShown:{type:Boolean,default:!1},hoverItem:{type:Boolean,default:!1}},data:function(){return{id:null}},beforeMount:function(){this.id="listItem"+this._uid},computed:{toggleId:function(){return this.collapsible?this.id:null}}},o=n,l=(s("56a3"),s("2877")),r=Object(l["a"])(o,i,a,!1,null,"03c581be",null);t["a"]=r.exports},bdad:function(e,t,s){"use strict";var i=s("c152"),a=s.n(i);a.a},c152:function(e,t,s){},ca3e:function(e,t,s){},d817:function(e,t,s){},da55:function(e,t,s){},f8f2:function(e,t,s){"use strict";var i=function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("b-form-group",{staticClass:"mb-0"},[e._t("input",[s("fr-floating-label-input",{attrs:{name:"password",fieldName:"password",type:"password",label:e.label||e.$t("common.placeholders.password"),reveal:!0,showErrorState:!1},on:{input:function(t){return e.setFailingPolicies(t)}},model:{value:e.password,callback:function(t){e.password=t},expression:"password"}})]),e._t("policy-panel",[s("fr-policy-panel",{staticClass:"mt-2",attrs:{"num-columns":e.cols,policies:e.policies,"policy-failures":e.failedPolicies}})])],2)},a=[],n=s("2ef0"),o=s("49c6"),l=function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("b-row",e._l(e.numColumns,(function(t){return s("b-col",{key:"password_policy_"+t},[s("small",[s("ul",{staticClass:"pl-4 text-left"},e._l(e.policyColumns[t-1],(function(t){return s("li",{key:t.policyId,class:[{"fr-valid":!e.includes(e.policyFailures,t.name)},"text-muted fr-policy-list-item"]},[e._v(" "+e._s(e.$t("common.policyValidationMessages."+t.name,t.params))+" ")])})),0)])])})),1)},r=[],c={name:"PolicyPanel",props:{numColumns:{type:Number,default:1},policies:{type:Array,default:function(){return[]}},policyFailures:{type:Array,default:function(){return[]}}},data:function(){return{policyColumns:[]}},computed:{numPolicies:function(){return this.policies.length}},methods:{includes:n["includes"],getPolicyColumns:function(e,t){var s=[],i=e.length,a=Math.floor(i/t),n=i%t,o=0;return e.forEach((function(e){"undefined"===typeof s[o]&&s.push([]),s[o].push({name:e.name,params:e.params});var t=o<n?a+1:a;s[o].length>=t&&(o+=1)})),s}},watch:{policies:{handler:function(e){this.policyColumns=this.getPolicyColumns(e,this.numColumns)},immediate:!0}}},u=c,d=(s("f989"),s("2877")),p=Object(d["a"])(u,l,r,!1,null,"48905e4d",null),f=p.exports,m={name:"PolicyPasswordInput",components:{"fr-floating-label-input":o["a"],"fr-policy-panel":f},props:{excludeOverwrite:{required:!1,type:Array,default:null},cols:{type:Number,default:2},failed:{type:Array,default:function(){return[]}},userPolicyObject:{type:Boolean,default:!1},label:{type:String,default:function(){return this.$t("common.placeholders.password")}},policyApi:{required:!0,type:String},value:{type:[String,Object],default:function(){return""}}},data:function(){return{failedPolicies:[],password:this.value,policies:[],policyService:function(){},serverFailures:[]}},watch:{failed:{handler:function(e){this.serverFailures=this.getFailedPolicyMessages(e)},deep:!0,immediate:!0},failedPolicies:function(e){this.$emit("valid",0===e.length)},password:function(e){this.$emit("input",e)},value:function(){this.password=this.value}},computed:{exclude:function(){return this.excludeOverwrite?this.excludeOverwrite:[{name:"REQUIRED",predicate:function(e){return Object(n["includes"])(e,"REQUIRED")&&Object(n["includes"])(e,"MIN_LENGTH")}},{name:"IS_NEW",predicate:function(){return"selfservice/registration"===this.policyApi}},"VALID_TYPE","CANNOT_CONTAIN_OTHERS"]}},methods:{isPasswordPolicyItem:Object(n["curry"])((function(e,t){return!Object(n["isEmpty"])(t[e].match("password"))})),toSimplePolicyObject:function(e){var t=e.policyRequirements,s=e.params,i=Object(n["first"])(t);return Object(n["isUndefined"])(i)?{}:{name:i,params:s}},toPolicyNames:function(e){var t=e.failedPolicyRequirements||[],s=t.filter(this.isPasswordPolicyItem("property")).map((function(e){return Object(n["at"])(e,["policyRequirements[0].policyRequirement"])}));return Object(n["flatten"])(s)},makeExclusions:function(e,t){var s=e&&e.policyRequirements?e.policyRequirements:[],i=e&&e.policies?e.policies:[],a=function(e){return Object(n["reject"])(i,(function(t){return Object(n["first"])(t.policyRequirements)===e}))};return t.forEach((function(e){Object(n["isObject"])(e)?e.predicate(s)&&(i=a(e.name)):Object(n["isString"])(e)&&Object(n["includes"])(s,e)&&(i=a(e))})),Object.assign({},e,{policyRequirements:s,policies:i})},getFailedPolicyMessages:function(e){var t=this;return 0===e.length?[]:this.failed.map((function(e){var s=e.policyRequirements[0].policyRequirement,i=e.policyRequirements[0].params;return t.$t("common.policyValidationMessages.".concat(s),i)}))},setFailingPolicies:Object(n["debounce"])((function(e){var t=this,s={password:e};this.policyApi.match("registration")&&(s={user:{password:this.password}}),this.policyService.post("/policy/".concat(this.policyApi,"/?_action=validateObject"),s).then((function(e){var s=e.data;t.failedPolicies=t.toPolicyNames(s),t.serverFailures=[]})).catch((function(){t.displayNotification("IDMMessages","error",t.$t("common.policyValidationMessages.policyServiceError.policyApi",{policyApi:t.policyApi}))}))}),200)},created:function(){var e=this,t=this.getAnonymousHeaders();this.policyService=this.getRequestService({headers:t}),this.policyService.get("/policy/".concat(this.policyApi)).then((function(t){var s=t.data;return Object(n["head"])(s.properties.filter(e.isPasswordPolicyItem("name")))})).then((function(t){return e.makeExclusions(t,e.exclude)})).then((function(t){var s=t.policies;e.policies=s.map(e.toSimplePolicyObject).filter((function(e){return!Object(n["isEmpty"])(e)}))})).catch((function(){e.displayNotification("IDMMessages","error",e.$t("common.policyValidationMessages.policyServiceError.policyApi",{policyApi:e.policyApi})),e.$router.push("/login")})),this.setFailingPolicies(this.password)}},h=m,b=Object(d["a"])(h,i,a,!1,null,null,null);t["a"]=b.exports},f989:function(e,t,s){"use strict";var i=s("d817"),a=s.n(i);a.a}}]);
//# sourceMappingURL=chunk-533b2867.31023639.js.map