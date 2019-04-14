const express = require('express')
const app = express()

const path = require('path')

const sqlite = require('sqlite')
const dbConnection = sqlite.open(path.resolve(__dirname, 'banco.sqlite'), { Promise })

const bodyParser = require('body-parser')


const port = process.env.PORT | 3000

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// use, toda requicao passa aqui
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.urlencoded({
    extended: true
}))

app.get('/', async(request, response) => {
    
    const db = await dbConnection
    const categoriasDB = await db.all(`SELECT * FROM categorias`)
    const vagasDB = await db.all(`SELECT * FROM vagas`)

    const categorias = categoriasDB.map( categoria => {
        return {
            ...categoria,
            vagas: vagasDB.filter( vaga => vaga.categoria === categoria.id )
        }
    })

    response.render('home', {
        title: 'Home',
        categorias,
    })
})

app.get('/vaga/:id', async(request, response) => {

    const idVaga = request.params.id

    const db = await dbConnection
    const vaga = await db.get(`SELECT * FROM vagas WHERE id = ${idVaga}`)
    response.render('vaga', {
        title: 'Vagas',
        vaga
    })
})

app.get('/admin', (req, res) => {
    res.render('admin/home', {
        title: 'Admin'
    })
})


// CRUD

// READ
app.get('/admin/vagas', async(req, res) => {
    const db = await dbConnection
    const vagas = await db.all(`SELECT * FROM vagas;`)

    res.render('admin/vagas', {
        title: 'Gerenciando vagas',
        vagas
    })
})

// categorias
app.get('/admin/categorias', async(req, res) => {
    const db = await dbConnection
    const categorias = await db.all(`SELECT * FROM categorias;`)

    res.render('admin/categorias', {
        title: 'Gerenciando categorias',
        categorias
    })
})

// CREATE
app.get('/admin/vagas/nova', async(req, res) => {
    
    const db = await dbConnection
    const categorias = await db.all(`SELECT * FROM categorias`)

    res.render('admin/nova-vaga', {
        title: 'Nova Vaga',
        categorias
    })
})

app.post('/admin/vagas/nova', async(req, res) => {
    // destructor assign
    const { categoria, titulo, descricao } = req.body

    const db = await dbConnection
    await db.run(`INSERT INTO vagas (categoria, titulo, descricao) VALUES ('${categoria}', '${titulo}', '${descricao}');`)

    res.redirect('/admin/vagas')
})

// categorias
app.get('/admin/categorias/nova', (req, res) => {
    res.render('admin/nova-categoria', {
        title: 'Nova categoria'
    })
})

app.post('/admin/categorias/nova', async(req, res) => {
    
    const categoria = req.body.categoria
    
    const db = await dbConnection
    await db.run(`INSERT INTO categorias (categoria) VALUES ('${categoria}');`)

    res.redirect('/admin/categorias')
})

// UPDATE
app.get('/admin/vagas/editar/:id', async(req, res) => {

    const idVaga = req.params.id

    const db = await dbConnection
    const categorias = await db.all(`SELECT * FROM categorias`)
    const vaga = await db.get(`SELECT * FROM vagas WHERE id = ${idVaga}`)

    res.render('admin/editar-vaga', {
        title: 'Editar Vaga',
        categorias,
        vaga
    })
})

app.post('/admin/vagas/editar/:id', async(req, res) => {

    // destructor assign
    const { categoria, titulo, descricao } = req.body
    const idVaga = req.params.id

    const db = await dbConnection
    await db.run(`UPDATE vagas SET categoria = ${categoria},
                        titulo = '${titulo}', 
                        descricao = '${descricao}'
                    WHERE id = ${idVaga}`)

    res.redirect('/admin/vagas')
})

app.get('/admin/categorias/editar/:id', async(req, res) => {
    const idCategoria = req.params.id

    const db = await dbConnection
    const categoria = await db.get(`SELECT * FROM categorias WHERE id = ${idCategoria}`)

    res.render('admin/editar-categoria', {
        title: 'Editar categoria',
        categoria
    })
})

app.post('/admin/categorias/editar/:id', async(req, res) => {
    const categoria = req.body.categoria
    const idCategoria = req.params.id

    const db = await dbConnection
    db.run(`UPDATE categorias SET categoria = '${categoria}' WHERE id = ${idCategoria}`)
    
    res.redirect('/admin/categorias')
})

// DELETE
app.get('/admin/vagas/delete/:id', async(req, res) => {
    const idVaga = req.params.id;

    const db = await dbConnection
    await db.run(`DELETE FROM vagas WHERE id = ${idVaga};`)
    
    res.redirect('/admin/vagas')
})

app.get('/admin/categorias/delete/:id', async(req, res) => {
    const idCategoria = req.params.id

    const db = await dbConnection
    db.run(`DELETE FROM categorias WHERE id = ${idCategoria}`)

    res.redirect('/admin/categorias')
})

const init = async() => {
    const db = await dbConnection
    await db.run(`CREATE TABLE IF NOT EXISTS categorias (id INTEGER PRIMARY KEY, categoria TEXT);`)
    await db.run(`CREATE TABLE IF NOT EXISTS vagas (id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descricao TEXT);`)
}

init()

app.listen(port, (err) => {
    if (err) {
        console.log('Erro no servidor')
    } else {
        console.log('Servidor Online ...')
    }
})
