import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-tarefas',
  imports: [FormsModule, CommonModule],
  templateUrl: './tarefas.html',
  styleUrls: ['./tarefas.css']
})
export class TarefasComponent {
  hoje = new Date().toISOString().split('T')[0];

  novaTarefa = { titulo: '', descricao: '', data: '', prioridade: 'media', categoria: '' };
  tarefas: any[] = [];

  termoPesquisa: string = '';

  // ----- CATEGORIAS -----
  categorias: any[] = [];
  novaCategoria = { nome: '', cor: '#563d7c' };
  categoriaSelecionadaParaExcluir: any = null;
  categoriaSendoUsada = false;
  erroExclusaoCategoria = '';
  erroNomeCategoria = false;

  tarefaSelecionadaParaExcluir: any = null;
  tarefaEditando: any = null;
  modoEdicao = false;

  formEdicaoAtual: NgForm | null = null;
  tarefaConfirmacaoEdicao: any = null;
  alertTarefaSalva = false;

  categoriaEditando: any = null;
  modoEdicaoCategoria: boolean = false;

  // ----- USUÁRIOS -----
  usuarios: any[] = [];
  usuario = { nome: '', sobrenome: '', idade: '', email: '', senha: '' };
  loginEmail = '';
  loginSenha = '';
  usuarioLogado: any = null;

  // ----- ERROS -----
  erroLoginEmail = false;
  erroLoginSenha = false;
  erroNome = false;
  erroSobrenome = false;
  erroIdade = false;
  erroEmail = false;
  erroSenha = false;
  erroEmailExistente = false;
  erroLoginObrigatorio = false;
  erroTarefaInvalida = false;

  // Variáveis de Filtro
  filtroData: string = ''; // Mantido para o filtro de data específica
  filtroPrioridade: string = '';
  filtroCategoria: string = '';
  
  // A variável ordenacaoData foi removida conforme solicitado.

  // ----- TEMA -----
  temaClaro = false;

  // ----- RESPONSIVIDADE -----
  sidebarAberta = false;

  aba: 'login' | 'cadastro' | 'config' | 'cadastrar' | 'todas' | 'concluidas' | 'abertas' | 'categorias' | 'ajuda' = 'login';

  // Variável para controlar o tópico de ajuda ativo
  topicoAjudaAtivo: string = '';

  // Estrutura de ajuda detalhada formatada com HTML
  duvidas = [
    {
      id: 'login',
      pergunta: 'Login e Acesso à Conta',
      conteudo: '<p>Se você já possui um cadastro, use esta aba para acessar suas tarefas. Siga os passos:</p><ul><li>Digite o <b>Email</b> e a <b>Senha</b> cadastrados.</li><li>Clique em <b>Entrar</b>.</li></ul><p>Se as credenciais estiverem incorretas, você receberá uma notificação de erro. Se for seu primeiro acesso, use a aba "Cadastro".</p>'
    },
    {
      id: 'cadastro',
      pergunta: 'Cadastro de Novo Usuário',
      conteudo: '<p>Para começar a usar o sistema, você deve se cadastrar preenchendo as informações:</p><ul><li>Preencha todos os campos obrigatórios (Nome, Sobrenome, Idade, Email e Senha).</li><li>O Email deve ser único e a Senha deve ter no mínimo 5 caracteres.</li><li>Clique em <b>Salvar</b>.</li></ul><p>Após o cadastro, você será redirecionado para a tela de Login.</p>'
    },
    {
      id: 'novaTarefa',
      pergunta: 'Adicionar e Editar Tarefas',
      conteudo: '<p>Para criar uma nova tarefa, vá em <b>Nova Tarefa</b>:</p><ul><li>Preencha o <b>Título</b> (mínimo 3 caracteres) e a <b>Data</b> (obrigatórios).</li><li>Defina a <b>Prioridade</b> (Baixa, Média, Alta) e selecione a <b>Categoria</b>.</li><li>Clique em <b>Cadastrar</b>.</li></ul><p>Para editar, clique no ícone de lápis (<i class="bi bi-pencil"></i>) na lista de tarefas; você será levado de volta à aba de cadastro para fazer as alterações.</p>'
    },
    {
      id: 'listagem-tarefas',
      pergunta: 'Listar e Gerenciar Tarefas',
      conteudo: '<p>A tela principal exibe suas tarefas em uma tabela. Aqui você pode:</p><ul><li>**Alternar status:** Clique no *switch* ao lado de uma tarefa para marcar/desmarcar como concluída.</li><li>**Editar:** Use o ícone de lápis (<i class="bi bi-pencil"></i>).</li><li>**Excluir:** Use o ícone de lixeira (<i class="bi bi-trash"></i>).</li></ul><p>Use os botões na lateral para ver apenas tarefas **Concluídas** ou **Abertas**.</p>'
    },
    {
      id: 'filtros-avancados',
      pergunta: 'Filtragem e Pesquisa',
      conteudo: '<p>Para encontrar rapidamente tarefas específicas, use os controles de filtro no topo da listagem:</p><ul><li>**Pesquisa:** Use o campo de busca principal para filtrar por **Título** ou **Descrição** da tarefa.</li><li>**Filtros Avançados:** Use o painel de filtros abaixo para refinar os resultados por:</li><ul><li>**Data:** Selecione uma data específica de vencimento.</li><li>**Prioridade:** Escolha Baixa, Média ou Alta.</li><li>**Categoria:** Filtre por categorias criadas por você.</li></ul></ul><p>Clique em **Limpar Todos os Filtros** para resetar a pesquisa e a filtragem avançada.</p>'
    },
    {
      id: 'status',
      pergunta: 'Alternar o Status (Concluído)',
      conteudo: '<p>Para marcar uma tarefa como concluída (ou reabri-la), utilize o seletor (checkbox/switch) na coluna <b>Status</b> da tabela.</p><p>O status é salvo automaticamente. Tarefas concluídas aparecem com a linha riscada.</p>'
    },
    {
      id: 'categorias',
      pergunta: 'Gerenciar Categorias',
      conteudo: '<p>Vá em <b>Categorias</b> para criar e organizar as etiquetas de suas tarefas.</p><ul><li>Para **Adicionar** uma nova, preencha o Nome e a Cor e clique em **Adicionar**.</li><li>Para **Editar**, clique no ícone de lápis (<i class="bi bi-pencil"></i>) ao lado da categoria na lista. O formulário será preenchido para você fazer as alterações e clicar em **Salvar Alterações**.</li></ul><p><b>Atenção:</b> Uma categoria só pode ser excluída (<i class="bi bi-trash"></i>) se não houver nenhuma tarefa vinculada a ela.</p>'
    },
    {
      id: 'config',
      pergunta: 'Configurações e Tema',
      conteudo: '<p>Na aba <b>Configurações</b>, você pode ver seus dados de perfil e alterar o visual do site:</p><ul><li>Clique em <b>Tema</b> para alternar entre o Tema Claro e o Tema Escuro.</li><li>Use o botão <b>Sair</b> para desconectar da conta e proteger suas tarefas.</li></ul>'
    }
  ];


  constructor() {
    this.carregarUsuarios();
    this.carregarTema();

    document.body.classList.toggle("tema-claro", this.temaClaro);

    const emailLogado = localStorage.getItem("usuarioLogadoEmail");
    if (emailLogado) {
      const user = this.usuarios.find(u => u.email === emailLogado);
      if (user) {
        this.usuarioLogado = user;
        this.carregarDadosUsuario(); // Carrega tarefas E categorias
        this.aba = 'cadastrar';
      } else {
        this.aba = 'login';
      }
    } else {
      this.aba = 'login';
    }
  }

  // ---- MENU MOBILE ----
  alternarSidebar() {
    this.sidebarAberta = !this.sidebarAberta;
  }

  fecharSidebar() {
    this.sidebarAberta = false;
  }

  // ---- ABA ----
  mudarAba(nome: any) {
    if (nome === 'cadastro') {
      this.usuario = { nome: '', sobrenome: '', idade: '', email: '', senha: '' };
      this.resetErrosCadastro();
    }
    // Reseta form de categoria ao sair da aba
    if (this.aba === 'categorias' && nome !== 'categorias') {
      this.erroNomeCategoria = false;
      this.categoriaSendoUsada = false;
      this.cancelarEdicaoCategoria(); // Adicionado para limpar a edição
    }

    // Define um tópico padrão ao entrar na aba ajuda.
    // Se o tópico clicado for o mesmo ativo, desativa para fechar o conteúdo (Acorceon-like)
    if (nome === 'ajuda') {
      if (this.aba !== 'ajuda') { // Se estava em outra aba, define um padrão
        this.topicoAjudaAtivo = '';
      }
    }

    this.aba = nome;
    this.fecharSidebar();
    
    // Atualiza a lista quando muda para uma aba de listagem (todas, abertas, concluidas)
    if (['todas', 'abertas', 'concluidas'].includes(nome)) {
        this.tarefasFiltradas();
    }
  }

  // Método para mudar o tópico de ajuda
  mudarTopicoAjuda(id: string) {
    if (this.topicoAjudaAtivo === id) {
      this.topicoAjudaAtivo = ''; // Fecha se for o mesmo
    } else {
      this.topicoAjudaAtivo = id;
    }
  }

  // ---- CADASTRO ----
  resetErrosCadastro() {
    this.erroNome = false;
    this.erroSobrenome = false;
    this.erroIdade = false;
    this.erroEmail = false;
    this.erroSenha = false;
    this.erroEmailExistente = false;
  }

  salvarUsuario() {
    this.resetErrosCadastro();
    this.erroNome = !this.usuario.nome.trim();
    this.erroSobrenome = !this.usuario.sobrenome.trim();
    this.erroIdade = !this.usuario.idade || isNaN(Number(this.usuario.idade));
    this.erroEmail = !this.usuario.email.includes('@');
    this.erroSenha = !this.usuario.senha || this.usuario.senha.length < 5;
    this.erroEmailExistente = this.usuarios.some(u => u.email === this.usuario.email);

    if (this.erroNome || this.erroSobrenome || this.erroIdade || this.erroEmail || this.erroSenha || this.erroEmailExistente) {
      return;
    }

    this.usuarios.push({ ...this.usuario });
    localStorage.setItem("usuarios", JSON.stringify(this.usuarios));
    this.usuario = { nome: '', sobrenome: '', idade: '', email: '', senha: '' };
    this.mudarAba('login');
  }

  carregarUsuarios() {
    const dados = localStorage.getItem("usuarios");
    this.usuarios = dados ? JSON.parse(dados) : [];
  }

  // ---- LOGIN ----
  login() {
    this.erroLoginEmail = false;
    this.erroLoginSenha = false;
    const usuariosCadastrados = JSON.parse(localStorage.getItem("usuarios") || "[]");
    const usuarioEncontrado = usuariosCadastrados.find((u: any) => u.email === this.loginEmail);

    if (!usuarioEncontrado) {
      this.erroLoginEmail = true;
      return;
    }

    if (this.loginSenha !== usuarioEncontrado.senha) {
      this.erroLoginSenha = true;
      return;
    }

    this.usuarioLogado = usuarioEncontrado;
    localStorage.setItem("usuarioLogadoEmail", usuarioEncontrado.email);
    this.carregarDadosUsuario(); // Carrega tudo ao logar
    this.mudarAba('cadastrar');
    this.loginEmail = '';
    this.loginSenha = '';
  }

  sair() {
    this.usuarioLogado = null;
    localStorage.removeItem("usuarioLogadoEmail");
    this.aba = 'login';
    this.tarefas = [];
    this.categorias = [];
    this.fecharSidebar();
  }

  // ---- TEMA ----
  carregarTema() {
    const t = localStorage.getItem("tema");
    this.temaClaro = t === 'claro';
    if (typeof document !== 'undefined') {
      if (this.temaClaro) {
        document.body.classList.add('tema-claro');
      } else {
        document.body.classList.remove('tema-claro');
      }
    }
  }

  get corBotaoSair(): string {
    return this.temaClaro ? '#000000' : '#ffffff';
  }


  alternarTema() {
    this.temaClaro = !this.temaClaro;
    localStorage.setItem("tema", this.temaClaro ? 'claro' : 'escuro');

    if (typeof document !== 'undefined') {
      if (this.temaClaro) {
        document.body.classList.add('tema-claro');
      } else {
        document.body.classList.remove('tema-claro');
      }
    }

    this.fecharSidebar();
  }


  exibirAlertTarefaSalva() {
    this.alertTarefaSalva = true;
    setTimeout(() => this.alertTarefaSalva = false, 3000);
  }

  // ---- TAREFAS ----
  adicionarTarefa(form: NgForm) {
    if (!this.usuarioLogado) {
      this.erroLoginObrigatorio = true;
      this.mudarAba('login');
      return;
    }

    if (form.invalid || this.novaTarefa.titulo.trim().length < 3) {
      this.erroTarefaInvalida = true;
      return;
    }

    this.tarefas.push({ ...this.novaTarefa, concluida: false });
    this.salvarLocalStorage();
    form.resetForm();
    // Reseta mantendo valores padrão seguros
    this.novaTarefa = { titulo: '', descricao: '', data: '', prioridade: 'media', categoria: '' };
    this.exibirAlertTarefaSalva();
  }

  // ---- PERSISTÊNCIA COMPLETA (Tarefas + Categorias) ----
  salvarLocalStorage() {
    if (!this.usuarioLogado) return;
    localStorage.setItem(`tarefas_${this.usuarioLogado.email}`, JSON.stringify(this.tarefas));
    localStorage.setItem(`categorias_${this.usuarioLogado.email}`, JSON.stringify(this.categorias));
  }

  carregarDadosUsuario() {
    if (!this.usuarioLogado) return;

    // Carregar Tarefas
    const dTarefas = localStorage.getItem(`tarefas_${this.usuarioLogado.email}`);
    this.tarefas = dTarefas ? JSON.parse(dTarefas) : [];

    // Carregar Categorias
    const dCategorias = localStorage.getItem(`categorias_${this.usuarioLogado.email}`);
    if (dCategorias) {
      this.categorias = JSON.parse(dCategorias);
    } else {
      // Categorias Padrão para novos usuários
      this.categorias = [
        { nome: 'Trabalho', cor: '#0d6efd' }, // Azul
        { nome: 'Pessoal', cor: '#198754' },  // Verde
        { nome: 'Urgente', cor: '#dc3545' }  // Vermelho
      ];
      this.salvarLocalStorage();
    }
  }

  // ---- CATEGORIAS ----
  adicionarCategoria() {
    if (!this.novaCategoria.nome.trim()) {
      this.erroNomeCategoria = true;
      return;
    }
    this.erroNomeCategoria = false;

    // Se estiver em modo de edição, atualiza a categoria editada
    if (this.modoEdicaoCategoria && this.categoriaEditando) {
      this.categoriaEditando.nome = this.novaCategoria.nome;
      this.categoriaEditando.cor = this.novaCategoria.cor;
      this.salvarLocalStorage();
      this.cancelarEdicaoCategoria(); // Sai do modo edição
    } else {
      // Se estiver adicionando (e não for duplicata)
      if (!this.categorias.some(c => c.nome.toLowerCase() === this.novaCategoria.nome.toLowerCase())) {
        this.categorias.push({ ...this.novaCategoria });
        this.salvarLocalStorage();
      }
    }

    // Reseta o formulário apenas se não estiver em modo de edição ou após finalizar a edição
    if (!this.modoEdicaoCategoria) {
      this.novaCategoria = { nome: '', cor: '#563d7c' };
    }
  }

  // Inicia o modo de edição
  iniciarEdicaoCategoria(cat: any) {
    this.categoriaEditando = cat;
    this.modoEdicaoCategoria = true;
    // Preenche o formulário com os dados da categoria a ser editada
    this.novaCategoria.nome = cat.nome;
    this.novaCategoria.cor = cat.cor;
  }

  // Cancela o modo de edição
  cancelarEdicaoCategoria() {
    this.categoriaEditando = null;
    this.modoEdicaoCategoria = false;
    // Limpa o formulário de volta para Adicionar
    this.novaCategoria = { nome: '', cor: '#563d7c' };
    this.erroNomeCategoria = false;
    this.categoriaSendoUsada = false;
  }

  obtendoCorTextoConstraste(hex: string): string {
    if (!hex) return '#ffffff';

    const cor = hex.replace('#', '');
    const r = parseInt(cor.substring(0, 2), 16);
    const g = parseInt(cor.substring(2, 4), 16);
    const b = parseInt(cor.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    return yiq >= 128 ? '#000000' : '#ffffff';
  }

  excluirCategoria(cat: any) {
    const emUso = this.tarefas.some(t => t.categoria === cat.nome);
    if (emUso) {
      this.categoriaSendoUsada = true;
      this.erroExclusaoCategoria = `A categoria "${cat.nome}" não pode ser excluída pois há tarefas vinculadas a ela.`;
      setTimeout(() => this.categoriaSendoUsada = false, 4000);
      return;
    }

    this.categoriaSendoUsada = false;
    this.categoriaSelecionadaParaExcluir = cat;
  }

  confirmarExclusaoCategoria() {
    if (this.categoriaSelecionadaParaExcluir) {
      this.categorias = this.categorias.filter(c => c !== this.categoriaSelecionadaParaExcluir);
      this.salvarLocalStorage();
      this.categoriaSelecionadaParaExcluir = null;
    }
  }

  cancelarExclusaoCategoria() {
    this.categoriaSelecionadaParaExcluir = null;
  }

  obterCorCategoria(nomeCategoria: string): string {
    const cat = this.categorias.find(c => c.nome === nomeCategoria);
    return cat ? cat.cor : '#6c757d'; // Cinza se não encontrar
  }



  // ---- EDIÇÃO DE TAREFAS ----
  editarTarefa(t: any) {
    this.modoEdicao = true;
    this.tarefaEditando = t;
    this.novaTarefa = { ...t };
    this.mudarAba('cadastrar');
  }

  solicitarConfirmacaoEdicao(form: NgForm) {
    if (form.invalid) return;
    this.tarefaConfirmacaoEdicao = { ...this.novaTarefa };
    this.formEdicaoAtual = form;
  }

  confirmarEdicao() {
    if (!this.formEdicaoAtual || !this.tarefaEditando) return;
    Object.assign(this.tarefaEditando, this.tarefaConfirmacaoEdicao);
    this.salvarLocalStorage();
    this.formEdicaoAtual.resetForm();
    this.cancelarEdicao();
    this.tarefaConfirmacaoEdicao = null;
    this.formEdicaoAtual = null;
    this.mudarAba('todas');
  }

  cancelarConfirmacaoEdicao() {
    this.tarefaConfirmacaoEdicao = null;
  }

  cancelarEdicao() {
    this.modoEdicao = false;
    this.tarefaEditando = null;
    this.novaTarefa = { titulo: '', descricao: '', data: '', prioridade: 'media', categoria: '' };
    this.formEdicaoAtual = null;
  }

  alternarStatus(tarefa: any) {
    const tarefaReal = this.tarefas.find(t => t === tarefa);

    if (tarefaReal) {
      tarefaReal.concluida = !tarefaReal.concluida; 
      this.salvarLocalStorage(); 
      this.tarefasFiltradas(); 
    }
  }

  confirmarExclusao(t: any) {
    this.tarefaSelecionadaParaExcluir = t;
  }

  cancelarExclusao() {
    this.tarefaSelecionadaParaExcluir = null;
  }

  excluirDefinitivo() {
    this.tarefas = this.tarefas.filter(t => t !== this.tarefaSelecionadaParaExcluir);
    this.salvarLocalStorage();
    this.cancelarExclusao();
  }

  // NOVO MÉTODO: Limpar todos os filtros
  limparTodosFiltros() {
    this.termoPesquisa = '';
    this.filtroData = '';
    this.filtroPrioridade = '';
    this.filtroCategoria = '';
    
    this.tarefasFiltradas(); 
  }

  // MÉTODO AJUSTADO PARA USAR filtroData (e remover ordenacaoData)
  tarefasFiltradas(): any[] {
    let lista = this.tarefas;

    // 1. FILTRAR POR ABA (Concluídas/Abertas)
    if (this.aba === 'concluidas') {
      lista = this.tarefas.filter(t => t.concluida);
    } else if (this.aba === 'abertas') {
      lista = this.tarefas.filter(t => !t.concluida);
    }

    // 2. FILTRAR POR TERMO DE PESQUISA (Nome/Descrição)
    if (this.termoPesquisa.trim()) {
      const termo = this.termoPesquisa.toLowerCase().trim();
      lista = lista.filter(t =>
        t.titulo.toLowerCase().includes(termo) ||
        t.descricao.toLowerCase().includes(termo)
      );
    }

    // 3. FILTRAR POR DATA ESPECÍFICA (NOVO/AJUSTADO)
    if (this.filtroData) {
      const dataFiltro = this.filtroData; // Ex: '2025-12-10'

      lista = lista.filter(t => {
        if (!t.data) return false;
        // Compara apenas a parte da data (AAAA-MM-DD)
        const dataTarefa = t.data.substring(0, 10); 
        return dataTarefa === dataFiltro;
      });
    }

    // 4. FILTRAR POR PRIORIDADE
    if (this.filtroPrioridade) {
      lista = lista.filter(t => t.prioridade === this.filtroPrioridade);
    }

    // 5. FILTRAR POR CATEGORIA
    if (this.filtroCategoria) {
      lista = lista.filter(t => t.categoria === this.filtroCategoria);
    }

    // 6. Ordenação Padrão: Por data mais antiga (para manter a consistência da lista)
    return lista.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }
}