const db = require("../db.js");
const AesEncryption = require("aes-encryption");
const aes = new AesEncryption();
const path = require("path");
const { createThumbnail } = require("./imageController");

const secretKey =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // 64 characters (32 bytes)
aes.setSecretKey(secretKey);

// get all users
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      `Select u.id, u.first_name, u.last_name, u.dateOfBirth, u.email, u.department, i.image_path, i.thumbnail_path
       FROM users u
       LEFT JOIN images i ON u.id = i.user_id`
    );
    // decrypted data
    const decryptedData = users.map((user) => ({
      id: user.id,
      first_name: aes.decrypt(user.first_name),
      last_name: aes.decrypt(user.last_name),
      dateOfBirth: aes.decrypt(user.dateOfBirth),
      email: aes.decrypt(user.email),
      department: aes.decrypt(user.department),
      image_url: user.image_path,
      thumbnail_url: user.thumbnail_path,
    }));

    res.status(200).send({
      message: "All users",
      data: decryptedData,
    });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};

// get user by id
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [user] = await db.query(
      `Select u.id, u.first_name, u.last_name, u.dateOfBirth, u.email, u.department, i.image_path, i.thumbnail_path
       FROM users u
       LEFT JOIN images i ON u.id = i.user_id
       WHERE u.id = ?`,
      [id]
    );

    if (user.length === 0) {
      res.status(404).send({ message: "User not found" });
    }
    const decryptedData = {
      id: user[0].id,
      first_name: aes.decrypt(user[0].first_name),
      last_name: aes.decrypt(user[0].last_name),
      dateOfBirth: aes.decrypt(user[0].dateOfBirth),
      email: aes.decrypt(user[0].email),
      department: aes.decrypt(user[0].department),
      image_url: user[0].image_path,
      thumbnail_url: user[0].thumbnail_path,
    };
    res.status(200).send({
      message: "User found",
      data: decryptedData,
    });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};

// create a user
exports.addUser = async (req, res) => {
  console.log(req.body);
  const { first_name, last_name, dateOfBirth, email, department } = req.body;
  const [emails] = await db.query("SELECT email FROM users");
  const decryptedEmail = emails.map((email) => aes.decrypt(email.email));
  if (decryptedEmail.includes(email)) {
    res.status(400).send({ message: "Email already exists" });
  }

  const image = req.file;

  const imagePath = "/uploads/" + image.filename; // Store image URL
  const thumbnailPath = "/uploads/thumbnails/" + image.filename; //
  // create thumbnail
  await createThumbnail(
    path.join("uploads", image.filename),
    path.join("uploads/thumbnails", image.filename)
  );

  try {
    const encryptedFirstName = aes.encrypt(first_name);
    const encryptedLastName = aes.encrypt(last_name);
    const encryptedDateOfBirth = aes.encrypt(dateOfBirth);
    const encryptedEmail = aes.encrypt(email);
    const encryptedDepartment = aes.encrypt(department);

    const [result] = await db.query(
      "INSERT INTO users (first_name, last_name, dateOfBirth, email, department) VALUES (?, ?, ?, ?, ?)",
      [
        encryptedFirstName,
        encryptedLastName,
        encryptedDateOfBirth,
        encryptedEmail,
        encryptedDepartment,
      ]
    );

    // retrieve the user ID
    const userId = result.insertId;

    await db.query(
      "INSERT INTO images (user_id, image_path, thumbnail_path) VALUES (?, ?, ?)",
      [userId, imagePath, thumbnailPath]
    );

    res.status(200).send({
      message: "User created successfully",
      userId: userId,
    });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};

// delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      res.status(404).send({ message: "User not found" });
    }
    res.status(200).send({ message: "User deleted successfully" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};

// updating a user
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, dateOfBirth, email, department } = req.body;
  console.log(req.file);
  try {
    const encryptedFirstName = aes.encrypt(first_name);
    const encryptedLastName = aes.encrypt(last_name);
    const encryptedDateOfBirth = aes.encrypt(dateOfBirth);
    const encryptedEmail = aes.encrypt(email);
    const encryptedDepartment = aes.encrypt(department);

    if (req.file == undefined || req.file == "undefined") {
      const [result] = await db.query(
        "UPDATE users SET first_name = ?, last_name = ?, dateOfBirth = ?, email = ?, department = ? WHERE id = ?",
        [
          encryptedFirstName,
          encryptedLastName,
          encryptedDateOfBirth,
          encryptedEmail,
          encryptedDepartment,
          id,
        ]
      );
      res
        .status(200)
        .send({ message: "User updated successfully", data: result });
      return;
    } else {
      const image = req.file;

      const imagePath = "/uploads/" + image.filename; // Store image URL
      const thumbnailPath = "/uploads/thumbnails/" + image.filename; //
      await createThumbnail(
        path.join("uploads", image.filename),
        path.join("uploads/thumbnails", image.filename)
      );
      const [result] = await db.query(
        "UPDATE users SET first_name = ?, last_name = ?, dateOfBirth = ?, email = ?, department = ? WHERE id = ?",
        [
          encryptedFirstName,
          encryptedLastName,
          encryptedDateOfBirth,
          encryptedEmail,
          encryptedDepartment,
          id,
        ]
      );
      await db.query(
        "UPDATE images SET image_path = ?, thumbnail_path = ? WHERE user_id = ?",
        [imagePath, thumbnailPath, id]
      );
      res
        .status(200)
        .send({ message: "User updated successfully", data: result });
    }
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};
