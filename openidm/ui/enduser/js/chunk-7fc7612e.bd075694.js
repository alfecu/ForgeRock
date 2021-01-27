/*!
 * Copyright 2019-2020 ForgeRock AS. All Rights Reserved 
 *  Use of this code requires a commercial software license with ForgeRock AS. or with one of its affiliates. All use shall be exclusively subject to such license between the licensee and ForgeRock AS.
 */
(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-7fc7612e"],{"1b01":function(t,e,s){"use strict";s.r(e);var i=function(){var t=this,e=t.$createElement,s=t._self._c||e;return s("fr-list-group",{attrs:{title:t.$t("pages.profile.preferences.title"),subtitle:t.$t("pages.profile.preferences.subtitle")}},t._l(t.preferences,(function(e,i){return s("fr-list-item",{key:i,attrs:{collapsible:!1,panelShown:!1}},[s("div",{staticClass:"d-inline-flex w-100",attrs:{slot:"list-item-header"},slot:"list-item-header"},[s("h6",{staticClass:"mt-3"},[t._v(t._s(e.description))]),s("div",{staticClass:"ml-auto"},[s("toggle-button",{staticClass:"mt-2 p-0 fr-toggle-primary",attrs:{id:i,height:28,width:56,sync:!0,cssColors:!0,value:e.value},on:{change:function(e){return t.savePreferences(i,e.value)}}})],1)])])})),1)},a=[],r=s("2ef0"),n=s.n(r),l=s("5231"),o=s("9830"),c={name:"Preferences",components:{"fr-list-group":l["a"],"fr-list-item":o["a"]},data:function(){return{preferences:{}}},mounted:function(){this.loadData()},methods:{loadData:function(){var t=this,e=n.a.keys(this.$root.userStore.state.profile.preferences),s=n.a.cloneDeep(this.$root.userStore.state.schema.properties.preferences.properties);n.a.each(e,(function(e){s[e].value=t.$root.userStore.state.profile.preferences[e],delete s[e].type})),this.preferences=s},generatePatch:function(t,e){return[{operation:"replace",field:"/preferences/"+t,value:e}]},savePreferences:function(t,e){this.$emit("updateProfile",this.generatePatch(t,e))}}},u=c,d=s("2877"),p=Object(d["a"])(u,i,a,!1,null,"f8da5672",null);e["default"]=p.exports},"31da":function(t,e,s){"use strict";var i=s("da55"),a=s.n(i);a.a},5231:function(t,e,s){"use strict";var i=function(){var t=this,e=t.$createElement,s=t._self._c||e;return s("b-card",{staticClass:"mb-3",attrs:{"no-body":""}},[t._t("list-group-header",[s("b-card-body",{staticClass:"py-4"},[s("h5",{class:[{"mb-4":t.subtitle,"mb-0":!t.subtitle},"card-title"]},[t._v(t._s(t.title))]),t.subtitle?s("h6",{staticClass:"card-subtitle mb-0 text-muted"},[t._v(t._s(t.subtitle))]):t._e()])]),s("b-list-group",{attrs:{flush:""}},[t._t("default")],2)],2)},a=[],r={name:"List-Group",props:{title:{type:String},subtitle:{type:String}},data:function(){return{}}},n=r,l=(s("31da"),s("2877")),o=Object(l["a"])(n,i,a,!1,null,"9e56b7f4",null);e["a"]=o.exports},"56a3":function(t,e,s){"use strict";var i=s("7a6d"),a=s.n(i);a.a},"7a6d":function(t,e,s){},9830:function(t,e,s){"use strict";var i=function(){var t=this,e=t.$createElement,s=t._self._c||e;return t.collapsible?s("div",{staticClass:"collapsible"},[s("b-list-group-item",{directives:[{name:"b-toggle",rawName:"v-b-toggle",value:t.toggleId,expression:"toggleId"}],class:[{"list-item-cursor":!1===t.collapsible}],attrs:{href:"#"}},[s("div",{staticClass:"media"},[t._t("list-item-header")],2)]),s("b-collapse",{attrs:{id:t.id,visible:t.panelShown},on:{hide:function(e){return t.$emit("hide")},show:function(e){return t.$emit("show")},hidden:function(e){return t.$emit("hidden")},shown:function(e){return t.$emit("shown")}}},[s("b-card-body",{staticClass:"pt-3"},[t._t("list-item-collapse-body")],2)],1)],1):s("div",{class:[{"fr-hover-item":t.hoverItem}],on:{click:function(e){return t.$emit("row-click")}}},[s("b-list-group-item",{staticClass:"noncollapse"},[s("div",{staticClass:"media"},[t._t("list-item-header")],2)]),t.panelShown?s("b-card-body",{staticClass:"pt-3"},[t._t("list-item-collapse-body")],2):t._e()],1)},a=[],r={name:"List-Item",props:{collapsible:{type:Boolean,default:!1},panelShown:{type:Boolean,default:!1},hoverItem:{type:Boolean,default:!1}},data:function(){return{id:null}},beforeMount:function(){this.id="listItem"+this._uid},computed:{toggleId:function(){return this.collapsible?this.id:null}}},n=r,l=(s("56a3"),s("2877")),o=Object(l["a"])(n,i,a,!1,null,"03c581be",null);e["a"]=o.exports},da55:function(t,e,s){}}]);
//# sourceMappingURL=chunk-7fc7612e.bd075694.js.map