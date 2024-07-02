// Importação dos pacotes instalados
const express = require('express')
const mysql = require('mysql2')
const bodyParser = require('body-parser')
const path = require('path')
const session = require('express-session')

// Criação do objeto para
// herdar os métodos do
// pacote express
const app = express()

// Configurações para
// criação e manipulação
// dos dados com elementos
// das páginas em HTML
app.use(bodyParser.urlencoded({extended: true})) // Envio de dados através dos formulários
app.use(express.static('public')) // Pasta dos arquivos CSS e JavaScript
app.set('views', path.join(__dirname, 'views')) // Pasta dos arquivos em EJS
app.set('view engine', 'ejs') // EJS (Embedded JavaScript - tornar as páginas HTML dinâmicas com JavaScript)

// Configuração do uso
// da sessão do usuário
// e proteção das rotas
app.use(session({
    secret: 'progSistSenac20244901',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 30 * 1000 // milissegundos = 60 * 60 * 24 * 1000
     }
}));

// Middleware de log para depuração
// Emite o ID da sessão e o status da sessão
app.use((req, res, next) => {
    console.log(`ID da sessão: ${req.sessionID}, Logado no sistema: ${req.session.logado}`);
    next();
});

// Evitando o cache na página de login
// Essa configuração evita carregar as páginas protegidas
// com o botão de voltar do navegador
app.use((req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
});

// Serviço de proteção
// de rotas (middleware)
function verificarLogin(req, res, next){
    if(req.session.logado){
        next() // autorizando o acesso às rotas
    } else {
        res.redirect('/')
    }
}

// Serviço de proteção
// de rotas (middleware) (ALTERNATIVA)
/* function verificarLogin(req, res, next){
    if(req.session.logado){
        next() // autorizando o acesso às rotas
    } else {
        res.render('login')
    }
}
 */

// Criação da conexão com
// o banco de dados já criado
const conexao = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'agencia_viagem'
})


// Verificando a conexão
// com o banco de dados
conexao.connect((error)=>{
    if(error){
        console.error('Erro ao conectar: ', error)
    }
    else{
        console.log('Conexão realizada com sucesso.')
    }    
})

// Criação de rotas
// com as operações no
// banco de dados

// Rotas: acessam páginas
// que farão operações no
// banco de dados

// Usa-se "endereços"
// para acessar a rota e a funcionalidade
// com a operação

// .get() - acessar páginas ou selecionar dados
// .post() - enviar ou manipular dados

// req (request - requisição)
// res (response - resposta)

// 1) Rota inicial do servidor local
app.get('/', (req, res)=>{
    // OBS: evitando que o usuário
    // acesse a rota de login caso
    // a sessão exista
    
    if(req.session.logado){
        res.redirect('/index')
    } else{
        // Carrega a página de
        // login se a sessão não existir
        res.render('login')
    }
})

// 1) Rota inicial do servidor local (ALTERNATIVA)
/* app.get('/', verificarLogin, (req, res)=>{
    res.redirect('/index')
}) */
  
// 2) Rota para a página
// de criação de registros
// e protegendo a rota
app.get('/criar', verificarLogin, (req, res)=>{
    // renderizar uma página
    // especificar o nome do arquivo
    res.render('criar')
})

// 3) Rota para o cadastro/criação de
// registros no banco
app.post('/criar-cliente', (req, res)=>{
    // atribuir constante com as colunas
    // da tabela
    const {nome, end_cliente, cep, tel_cliente, email} = req.body
    // escrever o comando em SQL
    const comando = 'insert into cliente(nome, end_cliente, cep, tel_cliente, email) values(?, ?, ?, ?, ?)'
    // executar o comando
    conexao.query(comando, [nome, end_cliente, cep, tel_cliente, email], (error, results)=>{
        // verificar se foi executado
        if(error){
            //res.status(500).send('Erro ao cadastrar o cliente: ', error)
            console.error('Erro ao cadastrar o cliente: ', error)
        }
        else{
            // direcionar para a página de cliente
            // especificar a rota            
            res.redirect('/listar')
            
            // Visualizar o resultado da operação
            // em uma mensagem no navegador
            //res.send('Cliente cadastrado com sucesso')
        }
    })
    
})


// 4) Rota para listagem de
// todos os dados criados
app.get('/listar', (req, res)=>{
    // escrever o comando em SQL
    const comando = 'select * from cliente'
    
    // executar o comando
    conexao.query(comando, (error, results)=>{
        
        // verificar se foi executado
        if(error){
            console.error('Erro ao listar os clientes: ', error)
        }
        else{
            res.render('listar', {clientes: results})
        }
    })
})

// 5) Rota para a página
// de edição de um registro selecionado
app.get('/editar/:id_cliente', (req, res)=>{
    // constante para representar
    // o id do registro
    const {id_cliente} = req.params // parâmetro da requisição
    // escrever o comando em SQL
    const comando = 'select * from cliente where id_cliente = ?'
    
    // executar o comando
    conexao.query(comando, [id_cliente], (error, results)=>{
        
        // verificar se foi executado
        if(error){
            console.error('Erro ao listar o cliente: ', error)
        }
        else{
            res.render('editar', {cliente: results[0]})
        }
    })
})
  
  // 6) Rota para a edição
  // do registro selecionado
  // e salvando no banco de dados
  app.post('/editar-cliente/:id_cliente', (req, res)=>{
    // constante para representar
    // o id do registro
    const {id_cliente} = req.params
    // atribuir constante com as colunas
    // da tabela
    const {nome, end_cliente, cep, tel_cliente, email} = req.body
    // escrever o comando em SQL
    const comando = 'update cliente set nome = ?, end_cliente = ?, cep = ?, tel_cliente = ?, email = ? where id_cliente = ?'
    // executar o comando
    conexao.query(comando, [nome, end_cliente, cep, tel_cliente, email, id_cliente], (error, results)=>{
        // verificar se foi executado
        if(error){
            //res.status(500).send('', error)
            console.error('Erro ao editar o cliente: ', error)
        }
        else{
            // redirecionar para uma
            // outra página
            // OBS: o método 'redirect()'
            // exige o nome da rota
            res.redirect('/listar')
        }
        
    })
  })

// 7) Rota para excluir um registro
// selecionado
app.get('/excluir/:id_cliente', (req, res)=>{
    // constante para representar
    // o id do registro
    const {id_cliente} = req.params
    // escrever o comando em SQL
    const comando = 'delete from cliente where id_cliente = ?'
    // executar o comando
    conexao.query(comando, [id_cliente], (error, results)=>{
        // verificar se foi executado
        if(error){            
            console.error('Erro ao excluir o cliente: ', error)
        } else {
            res.redirect('/listar')
        }
    })
})

// 8) Rota para autenticar
// o usuário e acessar o sistema
app.post('/login', (req, res)=>{
    const {email, senha} = req.body
    comando = 'select email, senha from usuario where email = ? and senha = ?'
    conexao.query(comando, [email, senha], (error, results)=>{
        if(error){
            console.error('Erro ao entrar: ', error)
        } else if( results.length > 0) {
            // Criando a sessão do usuário

            req.session.logado = true
            req.session.email = email


            res.redirect('/index')
        } else {
            const erro = "E-mail ou senha incorretos. Tente novamente"
            res.render('login', {erro: erro})
        }
    })
})

// 9) Rota para acessar
// a página 'index.ejs'
app.get('/index', verificarLogin, (req, res)=>{
    res.render('index')
})

// 10) Rota de encerramento de
// sessão (logout) e saída do
// sistema
app.get('/sair', (req, res)=>{
    // Destruindo a sessão

    req.session.destroy((error) => {
        if (error) {
            console.error('Erro ao sair: ', error);
            res.status(500).send('Erro ao sair.');
        } else {
            res.clearCookie('connect.sid', { path: '/' });
            console.log('Sessão destruída e cookie removido.'); // Emite a mensagem de sessão destruída
            res.redirect('/');
        }
    });
})

  
// Criação do método de execução
// do servidor local
app.listen(3000, ()=>{
    console.log('Servidor funcionando')
})

// Digite o seguinte endereço no navegador
// -> localhost:3000