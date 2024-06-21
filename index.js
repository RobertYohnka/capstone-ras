const {
    client,
    createTables,
    createUser,
    createDept,
    authenticate,
    fetchUsers,
    fetchDepartments,
    fetchAssignments,
    createAssignment,
    destroyAssignment
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

app.get('/api/users/:id/assignments', async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id) {
            const error = Error('not authorized');
            error.status = 401;
            throw error;
        }
        res.send(await fetchAssignments(req.params.id));
    }
    catch (ex) {
        next(ex);
    }
});

//add get request here for rasUnits
app.get('/api/rasUnits', async (req, res, next) => {
    try {
        res.send(await fetchRasUnits());
    } catch (ex) {
        next(ex);
    }
});

//add get request here for investigators
app.get('/api/investigators', async (req, res, next) => {
    try {
        res.send(await fetchInvestigators());
    } catch (ex) {
        next(ex);
    }
});

//add get request here for roles
app.get('/api/roles', async (req, res, next) => {
    try {
        res.send(await fetchRoles());
    }
    catch (ex) {
        next(ex);
    }
});

app.post('/api/users/:id/assignments', async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id) {
            const error = Error('not authorized');
            error.status = 401;
            throw error;
        }
        res.status(201).send(await createAssignment({ user_id: req.params.id, dept_id: req.body.dept_id }));
    }
    catch (ex) {
        next(ex);
    }
});

app.delete('/api/users/:user_id/assignments/:id', async (req, res, next) => {
    try {
        if (req.user.id !== req.params.user_id) {
            const error = Error('not authorized');
            error.status = 401;
            throw error;
        }
        await destroyAssignment({ user_id: req.params.user_id, id: req.params.id });
        res.sendStatus(204);
    }
    catch (ex) {
        next(ex);
    }
});

app.use((err, req, res, next) => {
    console.log(err);
    res.status(err.status || 500).send({ error: err.message ? err.message : err });
});

const init = async () => {
    const port = process.env.PORT || 3000;
    await client.connect();
    console.log('connected to database');

    await createTables();
    console.log('tables created');

    const school = await createSchool({
        schoolName: 'School of Medicine',
        schoolDean: 'Dr. Dean'
    });

    const dept = await createDept({
        name: 'Cardiology',
        deptID: uuid.v4().slice(0, 8),
        rasName: 'Default RAS',
        deptChair: 'Dr. Chair',
        deptChairEmail: 'chair@example.com',
        deptChairPhone: '1234567890',
        deptAdmin: 'Admin Placeholder',
        deptAdminEmail: 'admin@example.com',
        deptAdminPhone: '1234567890',
        schoolName: 'School of Medicine'
    });

    const [moe, lucy] = await Promise.all([
        createUser({
            username: 'moe',
            password: 'm_pw',
            empID: '0474123',
            jobTitle: 'Researcher',
            jobRole: 'Default Role',
            rasName: 'Default RAS',
            email: 'moe@example.com',
            phoneNumber: '1234567890'
        }),
        createUser({
            username: 'lucy',
            password: 'l_pw',
            empID: '0587454',
            jobTitle: 'Research Assistant',
            jobRole: 'Default Role',
            rasName: 'Default RAS',
            email: 'lucy@example.com',
            phoneNumber: '1234567890'
        })
    ]);

    console.log(await fetchUsers());
    console.log(await fetchDepartments());


    app.listen(port, () => console.log(`listening on port ${port}`));
};

init();