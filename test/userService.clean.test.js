const { UserService } = require('../src/userService');

const dadosUsuarioPadrao = {
  nome: 'Fulano de Tal',
  email: 'fulano@teste.com',
  idade: 25,
};

describe('UserService - Suíte de Testes Limpa', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    userService._clearDB();
  });

  const criarUsuarioPadrao = (overrides = {}) => {
    const { nome, email, idade, isAdmin } = { ...dadosUsuarioPadrao, ...overrides };
    return userService.createUser(nome, email, idade, isAdmin);
  };

  describe('createUser', () => {
    test('deve gerar um id para o usuário criado', () => {
      // Arrange
      const { nome, email, idade } = dadosUsuarioPadrao;

      // Act
      const usuarioCriado = userService.createUser(nome, email, idade);

      // Assert
      expect(usuarioCriado.id).toBeDefined();
    });

    test('deve criar o usuário com status ativo por padrão', () => {
      // Arrange
      const { nome, email, idade } = dadosUsuarioPadrao;

      // Act
      const usuarioCriado = userService.createUser(nome, email, idade);

      // Assert
      expect(usuarioCriado.status).toBe('ativo');
    });

    test('deve criar o usuário como não administrador por padrão', () => {
      // Arrange
      const { nome, email, idade } = dadosUsuarioPadrao;

      // Act
      const usuarioCriado = userService.createUser(nome, email, idade);

      // Assert
      expect(usuarioCriado.isAdmin).toBe(false);
    });

    test('deve lançar erro ao tentar criar usuário menor de idade', () => {
      // Arrange
      const idadeMenor = 17;

      // Act
      const criarUsuarioMenor = () => criarUsuarioPadrao({ idade: idadeMenor });

      // Assert
      expect(criarUsuarioMenor).toThrow('O usuário deve ser maior de idade.');
    });

    test.each([
      ['nome', { nome: '' }],
      ['email', { email: '' }],
      ['idade', { idade: 0 }],
    ])('deve lançar erro quando o campo obrigatório %s não é informado', (_campo, override) => {
      // Arrange
      const mensagemEsperada = 'Nome, email e idade são obrigatórios.';

      // Act
      const criarUsuarioInvalido = () => criarUsuarioPadrao(override);

      // Assert
      expect(criarUsuarioInvalido).toThrow(mensagemEsperada);
    });
  });

  describe('getUserById', () => {
    test('deve retornar o usuário criado quando o id existe', () => {
      // Arrange
      const usuarioCriado = criarUsuarioPadrao();

      // Act
      const usuarioBuscado = userService.getUserById(usuarioCriado.id);

      // Assert
      expect(usuarioBuscado).toEqual(usuarioCriado);
    });

    test('deve retornar o nome informado na criação ao buscar o usuário', () => {
      // Arrange
      const usuarioCriado = criarUsuarioPadrao();

      // Act
      const usuarioBuscado = userService.getUserById(usuarioCriado.id);

      // Assert
      expect(usuarioBuscado.nome).toBe(dadosUsuarioPadrao.nome);
    });

    test('deve retornar null quando o id não existe', () => {
      // Arrange
      const idInexistente = 'id-que-nao-existe';

      // Act
      const resultado = userService.getUserById(idInexistente);

      // Assert
      expect(resultado).toBeNull();
    });
  });

  describe('deactivateUser', () => {
    test('deve retornar true ao desativar um usuário comum', () => {
      // Arrange
      const usuarioComum = criarUsuarioPadrao({ isAdmin: false });

      // Act
      const resultado = userService.deactivateUser(usuarioComum.id);

      // Assert
      expect(resultado).toBe(true);
    });

    test('deve marcar o usuário comum como inativo após desativá-lo', () => {
      // Arrange
      const usuarioComum = criarUsuarioPadrao({ isAdmin: false });

      // Act
      userService.deactivateUser(usuarioComum.id);

      // Assert
      expect(userService.getUserById(usuarioComum.id).status).toBe('inativo');
    });

    test('deve retornar false ao tentar desativar um administrador', () => {
      // Arrange
      const usuarioAdmin = criarUsuarioPadrao({ isAdmin: true });

      // Act
      const resultado = userService.deactivateUser(usuarioAdmin.id);

      // Assert
      expect(resultado).toBe(false);
    });

    test('deve manter o administrador ativo após tentar desativá-lo', () => {
      // Arrange
      const usuarioAdmin = criarUsuarioPadrao({ isAdmin: true });

      // Act
      userService.deactivateUser(usuarioAdmin.id);

      // Assert
      expect(userService.getUserById(usuarioAdmin.id).status).toBe('ativo');
    });

    test('deve retornar false ao tentar desativar um usuário inexistente', () => {
      // Arrange
      const idInexistente = 'id-que-nao-existe';

      // Act
      const resultado = userService.deactivateUser(idInexistente);

      // Assert
      expect(resultado).toBe(false);
    });
  });

  describe('generateUserReport', () => {
    test('deve incluir o id, o nome e o status de cada usuário no relatório', () => {
      // Arrange
      const alice = criarUsuarioPadrao({ nome: 'Alice', email: 'alice@email.com', idade: 28 });

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toEqual(expect.stringContaining(alice.id));
      expect(relatorio).toEqual(expect.stringContaining('Alice'));
      expect(relatorio).toEqual(expect.stringContaining('ativo'));
    });

    test('deve incluir todos os usuários cadastrados no relatório', () => {
      // Arrange
      criarUsuarioPadrao({ nome: 'Alice', email: 'alice@email.com', idade: 28 });
      criarUsuarioPadrao({ nome: 'Bob', email: 'bob@email.com', idade: 32 });

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toEqual(expect.stringContaining('Alice'));
      expect(relatorio).toEqual(expect.stringContaining('Bob'));
    });

    test('deve exibir o status inativo de um usuário desativado no relatório', () => {
      // Arrange
      const usuario = criarUsuarioPadrao();
      userService.deactivateUser(usuario.id);

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toEqual(expect.stringContaining('inativo'));
    });

    test('deve informar que não há usuários quando o banco está vazio', () => {
      // Arrange
      // (nenhum usuário criado: o beforeEach já limpou o banco)

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toEqual(expect.stringContaining('Nenhum usuário cadastrado.'));
    });
  });
});
