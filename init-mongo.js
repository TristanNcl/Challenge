db.createUser({
  user: "testUser",
  pwd: "testPassword",
  roles: [
    {
      role: "readWrite",
      db: "pchDB",
    },
  ],
})
