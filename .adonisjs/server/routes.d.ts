import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'signup.success': { paramsTuple?: []; params?: {} }
    'signup': { paramsTuple?: []; params?: {} }
    'signup.store': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'login.store': { paramsTuple?: []; params?: {} }
    'app.home': { paramsTuple?: []; params?: {} }
    'logout': { paramsTuple?: []; params?: {} }
    'tweets.index': { paramsTuple?: []; params?: {} }
    'tweets.store': { paramsTuple?: []; params?: {} }
    'tweets.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tweets.toggle_like': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.follow': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'profile.update': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'signup.success': { paramsTuple?: []; params?: {} }
    'signup': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'app.home': { paramsTuple?: []; params?: {} }
    'tweets.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'signup.success': { paramsTuple?: []; params?: {} }
    'signup': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'app.home': { paramsTuple?: []; params?: {} }
    'tweets.index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'signup.store': { paramsTuple?: []; params?: {} }
    'login.store': { paramsTuple?: []; params?: {} }
    'logout': { paramsTuple?: []; params?: {} }
    'tweets.store': { paramsTuple?: []; params?: {} }
    'tweets.toggle_like': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.follow': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'tweets.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'profile.update': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}