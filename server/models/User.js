```js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  uid: {
    type: String,
    unique: true,
  },

  name: String,

  email: {
    type: String,
    unique: true,
  },

  password: String,

  wallet: {
    type: Number,
    default: 700,
  },

  isBanned: {
    type: Boolean,
    default: false,
  },

  role: {
    type: String,
    default: "user",
  },
});

const User =
  mongoose.models.User ||
  mongoose.model("User", UserSchema);

export default User;
```
