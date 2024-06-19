const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/ras_community_db');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT = process.env.JWT || 'shhh';
if (JWT === 'shhh') {
    console.log('If deployed, set process.env.JWT to something other than shhh');
}

const createTables = async () => {
    const SQL = `
    DROP TABLE IF EXISTS assignments;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS departments;
    DROP TABLE IF EXISTS roles;
    DROP TABLE IF EXISTS investigators;
    DROP TABLE IF EXISTS rasUnits;
    DROP TABLE IF EXISTS schools;
    
    CREATE TABLE roles(
        id UUID PRIMARY KEY,
        roleName VARCHAR(20) UNIQUE NOT NULL,
        mgmtYsNo BOOLEAN
        );
    
    CREATE TABLE rasUnits(
        id UUID PRIMARY KEY,
        rasName VARCHAR(20) UNIQUE NOT NULL,
        rasHead VARCHAR(20),
        rasEmail VARCHAR(20),
        rasWebsite VARCHAR(20)
        );

    CREATE TABLE users(
        id UUID PRIMARY KEY,
        username VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        empID VARCHAR(10),
        jobTitle VARCHAR(20),
        jobRole VARCHAR(20) REFERENCES roles(roleName),
        rasName VARCHAR(20) REFERENCES rasUnits(rasName),
        email VARCHAR(20),
        phoneNumber VARCHAR(10)
        );

    CREATE TABLE investigators(
        id UUID PRIMARY KEY,
        usernme VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        empID VARCHAR(10),
        invTitle VARCHAR(20),
        email VARCHAR(20),
        phoneNumber VARCHAR(10)
        );
        

    CREATE TABLE schools(
        id UUID PRIMARY KEY,
        schoolName VARCHAR(20) UNIQUE NOT NULL,
        schoolDean VARCHAR(20)
        );

    CREATE TABLE departments(
        id UUID PRIMARY KEY,
        name VARCHAR(20) UNIQUE NOT NULL,
        deptID VARCHAR(10),
        rasName VARCHAR(20) REFERENCES rasUnits(rasName),
        deptChair VARCHAR(20),
        deptChairEmail VARCHAR(20),
        deptChairPhone VARCHAR(10),
        deptAdmin VARCHAR(20),
        deptAdminEmail VARCHAR(20),
        deptAdminPhone VARCHAR(10),
        schoolName VARCHAR(20) REFERENCES schools(schoolName)
        );

    CREATE TABLE assignments(
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) NOT NULL,
        dept_id UUID REFERENCES departments(id) NOT NULL,
        CONSTRAINT unique_user_id_and_dept_id UNIQUE (user_id, dept_id)
        );
    `;
    await client.query(SQL);
};

const createUser = async ({ username, password, empID, jobTitle, jobRole, rasName, email, phoneNumber }) => {
    const SQL = `
        INSERT INTO users(id, username, password, empID, jobTitle, jobRole, rasName, email, phoneNumber) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `;
    const response = await client.query(SQL, [uuid.v4(), username, await bcrypt.hash(password, 5), empID, jobTitle, rasName, jobRole, email, phoneNumber]);
    return response.rows[0];
};

const createDept = async ({ name, deptID, rasName, deptChair, deptChairEmail, deptChairPhone, deptAdmin, deptAdminEmail, deptAdminPhone, schoolName }) => {
    const SQL = `
        INSERT INTO departments(id, name, deptID, rasName, deptChair, deptChairEmail, deptChairPhone, deptAdmin, deptAdminEmail, deptAdminPhone, schoolName) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *
    `;
    const response = await client.query(SQL, [uuid.v4(), name, deptID, rasName, deptChair, deptChairEmail, deptChairPhone, deptAdmin, deptAdminEmail, deptAdminPhone, schoolName]);
    return response.rows[0];
};

const createAssignment = async ({ user_id, dept_id }) => {
    const SQL = `
        INSERT INTO assignments(id, user_id, dept_id) VALUES($1, $2, $3) RETURNING *
    `;
    const response = await client.query(SQL, [uuid.v4(), user_id, dept_id]);
    return response.rows[0];
};

const destroyAssignment = async ({ user_id, id }) => {
    const SQL = `
        DELETE FROM assignments WHERE user_id=$1 AND id=$2
    `;
    await client.query(SQL, [user_id, id]);
};

const authenticate = async ({ username, password }) => {
    const SQL = `
        SELECT id, username, password FROM users WHERE username=$1;
    `;
    const response = await client.query(SQL, [username]);
    if (response.rows.length || (await bcrypt.compare(password, response.rows[0].password)) === false) {
        const error = Error('bad credentials');
        error.status = 401;
        throw error;
    }
    const token = await jwt.sign({ id: response.rows[0].id }, JWT);
    return { token };
};

// const findUserWithToken = async (token) => {
//     let id;
//     try {
//         const payload = await jwt.verify(token, JWT);
//         id = payload.id;
//     }
//     catch (ex) {
//         const error = Error('bad token');
//         error.status = 401;
//         throw error;
//     }
//     const SQL = `
//         SELECT id, username FROM users WHERE id=$1
//     `;
//     const response = await client.query(SQL, [id]);
//     if (!response.rows.length) {
//         const error = Error('bad token');
//         error.status = 401;
//         throw error;
//     }
//     return response.rows[0];
// };

const fetchUsers = async () => {
    const SQL = `
        SELECT id, username FROM users;
    `;
    const response = await client.query(SQL);
    return response.rows;
};

const fetchDepartments = async () => {
    const SQL = `
        SELECT id, name FROM departments;
    `;
    const response = await client.query(SQL);
    return response.rows;
};

const fetchAssignments = async (user_id) => {
    const SQL = `
        SELECT * FROM assignments WHERE user_id=$1
    `;
    const response = await client.query(SQL, [user_id]);
    return response.rows;
};

module.exports = {
    client,
    createTables,
    createUser,
    createDept,
    createAssignment,
    destroyAssignment,
    authenticate,
    fetchUsers,
    fetchDepartments,
    fetchAssignments
};
