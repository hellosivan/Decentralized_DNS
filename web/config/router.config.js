export default [
  // user
  {
    path: '/user',
    component: '../layouts/UserLayout',
    routes: [
      { path: '/user', redirect: '/user/login' },
      { path: '/user/login', component: './User/Login' },
      { path: '/user/register', component: './User/Register' },
      { path: '/user/register-result', component: './User/RegisterResult' },
    ],
  },
  // app
  {
    path: '/',
    component: '../layouts/BasicLayout',
    Routes: ['src/pages/Authorized'],
    //authority: ['admin', 'user'],
    routes: [
      // domainNameParsing
      { path: '/', redirect: '/parsing' },
      {
        path: '/parsing',
        name: 'parsing',
        icon: 'file-text',
        routes: [
          {
            path: '/parsing',
            name: 'parsing',
            component: './Parsing',
          },
        ],
      },
      // domainNameManagement
      {
        path: '/domainNameManagement',
        name: 'domainNameManagement',
        icon: 'file-text',
        authority: 'user',
        routes: [
          {
            path: '/domainNameManagement/operating',
            name: 'operating',
            component: './Operating',
          },
          {
            path: '/domainNameManagement/confirm',
            name: 'confirm',
            component: './Confirm',
          },
          {
            path: '/domainNameManagement/transfering',
            name: 'transfering',
            component: './Transfering',
          },
          {
            path: '/domainNameManagement/userCenter',
            name: 'userCenter',
            component: './UserCenter',
          },
        ],
      },
      {
        component: '404',
      },
    ],
  },
];
