const {
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
} = require('./db');
const express = require('express');
const app = express();
app.use(express.json());

app.get('/api/users', async (req, res, next) => {
    try {
        res.send(await fetchUsers());
    }
    catch (ex) {
        next(ex);
    }
});

app.get('/api/departments', async (req, res, next) => {
    try {
        res.send(await fetchDepartments());
    }
    catch (ex) {
        next(ex);
    }
});

app.get('/api/assignments/:user_id', async (req, res, next) => {
    try {
        res.send(await fetchAssignments(req.params.user_id));
    }
    catch (ex) {
        next(ex);
    }
});

app.post('/api/users/:user_id/assignments', async (req, res, next) => {
    try {
        res.status(201).send(await createAssignment({ user_id: req.params.user_id, dept_id: req.body.dept_id }));
    }
    catch (ex) {
        next(ex);
    }
});

app.delete('/api/users/:user_id/assignments/:id', async (req, res, next) => {
    try {
        await destroyAssignment({ id: req.params.id, user_id: req.params.user_id });
        res.sendStatus(204);
    }
    catch (ex) {
        next(ex);
    }
});

app.use((err, req, res, next) => {
    res.status(err.status || 500).send({ error: err.message || err });
});

const init = async () => {
    console.log('connecting to the database');
    const port = process.env.PORT || 3000;
    await client.connect();
    console.log('connected to database');
    await createTables();
    console.log('tables created');

    const [chris, hayli, amanda, sarah, emma, fran, jill, pathology, dermatology, urology, emergMedicine, neurology, obGyn, surgery] = await Promise.all([
        createUser({ username: 'chris', password: 'ch_pw' }),
        createUser({ username: 'hayli', password: 'ha_pw' }),
        createUser({ username: 'amanda', password: 'am_pw' }),
        createUser({ username: 'sarah', password: 'sa_pw' }),
        createUser({ username: 'emma', password: 'em_pw' }),
        createUser({ username: 'fran', password: 'fr_pw' }),
        createUser({ username: 'jill', password: 'ji_pw' }),
        createDept({ name: 'pathology' }),
        createDept({ name: 'dermatology' }),
        createDept({ name: 'urology' }),
        createDept({ name: 'emergMedicine' }),
        createDept({ name: 'neurology' }),
        createDept({ name: 'obGyn' }),
    ]);

    console.log(await fetchUsers());
    console.log(await fetchDepartments());

    const [assignment1, assignment2, assignment3, assignment4, assignment5, assignment6] = await Promise.all([
        createAssignment({ user_id: chris.id, dept_id: pathology.id }),
        createAssignment({ user_id: hayli.id, dept_id: dermatology.id }),
        createAssignment({ user_id: amanda.id, dept_id: urology.id }),
        createAssignment({ user_id: sarah.id, dept_id: emergMedicine.id }),
        createAssignment({ user_id: emma.id, dept_id: neurology.id }),
        createAssignment({ user_id: fran.id, dept_id: obGyn.id }),
        createAssignment({ user_id: jill.id, dept_id: surgery.id }),
    ]);

    console.log(await fetchAssignments());
    await destroyAssignment({ id: assignment1.id, user_id: assignment1.user_id });
    console.log(await fetchAssignments());
    const assignment = await createAssignment({ user_id: chris.id, dept_id: pathology.id });
    app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
