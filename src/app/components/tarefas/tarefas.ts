import { Component, OnDestroy } from '@angular/core';
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

  // Tipos mais explícitos
  interfaceTarefa = true;

  // ----- TAREFAS -----
  novaTarefa: { titulo: string; descricao: string; data: string; prioridade: 'baixa' | 'media' | 'alta'; categoria: string } = { titulo: '', descricao: '', data: '', prioridade: 'media', categoria: '' };
  tarefas: { id: string; titulo: string; descricao: string; data: string; prioridade: 'baixa' | 'media' | 'alta'; categoria: string; concluida: boolean }[] = [];

  tarefaSelecionadaParaExcluir: { id: string; titulo: string; descricao: string; data: string; prioridade: 'baixa' | 'media' | 'alta'; categoria: string; concluida: boolean } | null = null;
  tarefaEditando: { id: string; titulo: string; descricao: string; data: string; prioridade: 'baixa' | 'media' | 'alta'; categoria: string; concluida: boolean } | null = null;
  modoEdicao = false;

  formEdicaoAtual: NgForm | null = null;
  tarefaConfirmacaoEdicao: { id?: string; titulo: string; descricao: string; data: string; prioridade?: 'baixa' | 'media' | 'alta'; categoria?: string; concluida?: boolean } | null = null;
  alertTarefaSalva = false;
  private alertTimeout: any = null;

  // ----- CATEGORIAS -----
  categorias: { id: string; nome: string; cor: string }[] = [];
  novaCategoria: { nome: string; cor: string } = { nome: '', cor: '#3b82f6' };
  erroNomeCategoria = false;
  categoriaSelecionadaParaExcluir: { id: string; nome: string; cor: string } | null = null;
  erroExclusaoCategoria = '';
  categoriaSendoUsada = false;

  // ----- USUÁRIOS -----
  usuarios: { nome: string; sobrenome: string; idade: string; email: string; senha: string }[] = [];
  usuario: { nome: string; sobrenome: string; idade: string; email: string; senha: string } = { nome: '', sobrenome: '', idade: '', email: '', senha: '' };
  loginEmail = '';
  loginSenha = '';
  usuarioLogado: { nome: string; sobrenome: string; idade: string; email: string; senha: string } | null = null;

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

  // ----- TEMA -----
  temaClaro = false;

  // ----- RESPONSIVIDADE -----
  sidebarAberta = false; // Controle do menu mobile

  aba: 'login' | 'cadastro' | 'config' | 'cadastrar' | 'todas' | 'concluidas' | 'abertas' | 'categorias' = 'login';

  constructor() {
    this.carregarUsuarios();
    this.carregarTema();
    this.carregarCategorias();

    const emailLogado = localStorage.getItem("usuarioLogadoEmail");
    if (emailLogado) {
      const user = this.usuarios.find(u => u.email === emailLogado);
      if (user) {
        this.usuarioLogado = user;
        this.aba = 'cadastrar';
        this.carregarLocalStorage();
      } else {
        this.aba = 'login';
      }
    } else {
      this.aba = 'login';
    }
  }

  ngOnDestroy(): void {
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
      this.alertTimeout = null;
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
    this.aba = nome;
    this.fecharSidebar(); // Fecha o menu ao clicar em um item no mobile
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
    try {
      localStorage.setItem("usuarios", JSON.stringify(this.usuarios));
    } catch (e) {
      console.error('Erro ao salvar usuários no localStorage', e);
    }
    this.usuario = { nome: '', sobrenome: '', idade: '', email: '', senha: '' };
    this.mudarAba('login');
  }

  carregarUsuarios() {
    const dados = localStorage.getItem("usuarios");
    if (!dados) {
      this.usuarios = [];
      return;
    }
    try {
      this.usuarios = JSON.parse(dados);
    } catch (e) {
      console.warn('Dados de usuários corrompidos no localStorage — limpando', e);
      this.usuarios = [];
      localStorage.removeItem('usuarios');
    }
  }

  // ---- LOGIN ----
  login() {
    let usuariosCadastrados: any[] = [];
    try {
      usuariosCadastrados = JSON.parse(localStorage.getItem("usuarios") || "[]");
    } catch (e) {
      usuariosCadastrados = [];
    }
    const usuarioEncontrado = usuariosCadastrados.find((u: any) => u.email === this.loginEmail);

    if (!usuarioEncontrado || this.loginSenha !== usuarioEncontrado.senha) {
      this.erroLoginEmail = true;
      this.erroLoginSenha = true;
      return;
    }

    this.usuarioLogado = usuarioEncontrado;
    try {
      localStorage.setItem("usuarioLogadoEmail", usuarioEncontrado.email);
    } catch (e) {
      console.error('Erro ao salvar usuário logado', e);
    }
    this.erroLoginEmail = false;
    this.erroLoginSenha = false;
    this.mudarAba('cadastrar');
  }

  sair() {
    this.usuarioLogado = null;
    localStorage.removeItem("usuarioLogadoEmail");
    this.aba = 'login';
    this.tarefas = [];
    this.fecharSidebar();
  }

  // ---- TEMA ----
  carregarTema() {
    const t = localStorage.getItem("tema");
    if (t === 'claro') this.temaClaro = true;
  }

  alternarTema() {
    this.temaClaro = !this.temaClaro;
    localStorage.setItem("tema", this.temaClaro ? 'claro' : 'escuro');
    this.fecharSidebar();
  }

  exibirAlertTarefaSalva() {
    this.alertTarefaSalva = true;
    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    this.alertTimeout = setTimeout(() => {
      this.alertTarefaSalva = false;
      this.alertTimeout = null;
    }, 3000);
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

    const newT = {
      id: Date.now().toString() + Math.random().toString(16).slice(2),
      titulo: this.novaTarefa.titulo,
      descricao: this.novaTarefa.descricao,
      data: this.novaTarefa.data,
      prioridade: this.novaTarefa.prioridade,
      categoria: this.novaTarefa.categoria,
      concluida: false
    };

    this.tarefas.push(newT);
    this.salvarLocalStorage();
    form.resetForm();
    this.novaTarefa = { titulo: '', descricao: '', data: '', prioridade: 'media', categoria: '' };
    this.erroTarefaInvalida = false;
    this.exibirAlertTarefaSalva();
  }

  salvarLocalStorage() {
    if (!this.usuarioLogado) return;
    try {
      localStorage.setItem(`tarefas_${this.usuarioLogado.email}`, JSON.stringify(this.tarefas));
    } catch (e) {
      console.error('Erro ao salvar tarefas', e);
    }
  }

  carregarLocalStorage() {
    if (!this.usuarioLogado) return;
    const d = localStorage.getItem(`tarefas_${this.usuarioLogado.email}`);
    if (!d) {
      this.tarefas = [];
      return;
    }
    try {
      this.tarefas = JSON.parse(d);
    } catch (e) {
      console.warn('Dados de tarefas corrompidos — limpando', e);
      this.tarefas = [];
      localStorage.removeItem(`tarefas_${this.usuarioLogado.email}`);
    }
  }

  // ---- EDIÇÃO ----
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
    this.erroTarefaInvalida = false;
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

  alternarStatus(i: number) {
    this.tarefas[i].concluida = !this.tarefas[i].concluida;
    this.salvarLocalStorage();
  }

  confirmarExclusao(t: any) {
    this.tarefaSelecionadaParaExcluir = t;
  }

  cancelarExclusao() {
    this.tarefaSelecionadaParaExcluir = null;
  }

  excluirDefinitivo() {
    if (this.tarefaSelecionadaParaExcluir) {
      this.tarefas = this.tarefas.filter(t => t.id !== this.tarefaSelecionadaParaExcluir!.id);
    }
    this.salvarLocalStorage();
    this.cancelarExclusao();
  }

  tarefasFiltradas(): { id: string; titulo: string; descricao: string; data: string; prioridade: 'baixa' | 'media' | 'alta'; categoria: string; concluida: boolean }[] {
    if (this.aba === 'concluidas') return this.tarefas.filter(t => t.concluida);
    if (this.aba === 'abertas') return this.tarefas.filter(t => !t.concluida);
    return this.tarefas;
  }

  // ---- CATEGORIAS ----
  carregarCategorias() {
    const dados = localStorage.getItem("categorias");
    if (!dados) {
      this.categorias = [];
      return;
    }
    try {
      this.categorias = JSON.parse(dados);
    } catch (e) {
      console.warn('Dados de categorias corrompidos no localStorage — limpando', e);
      this.categorias = [];
      localStorage.removeItem('categorias');
    }
  }

  salvarCategorias() {
    try {
      localStorage.setItem("categorias", JSON.stringify(this.categorias));
    } catch (e) {
      console.error('Erro ao salvar categorias no localStorage', e);
    }
  }

  adicionarCategoria() {
    this.erroNomeCategoria = !this.novaCategoria.nome.trim();
    if (this.erroNomeCategoria) return;

    const novaCategoria = {
      id: Date.now().toString() + Math.random().toString(16).slice(2),
      nome: this.novaCategoria.nome,
      cor: this.novaCategoria.cor
    };

    this.categorias.push(novaCategoria);
    this.salvarCategorias();
    this.novaCategoria = { nome: '', cor: '#3b82f6' };
    this.erroNomeCategoria = false;
  }

  excluirCategoria(categoria: any) {
    const categoriasUsadas = this.tarefas.filter(t => t.categoria === categoria.nome).length;
    
    if (categoriasUsadas > 0) {
      this.categoriaSendoUsada = true;
      this.erroExclusaoCategoria = `Não é possível excluir esta categoria. Ela está sendo usada em ${categoriasUsadas} tarefa${categoriasUsadas > 1 ? 's' : ''}.`;
      return;
    }

    this.categoriaSelecionadaParaExcluir = categoria;
    this.categoriaSendoUsada = false;
    this.erroExclusaoCategoria = '';
  }

  cancelarExclusaoCategoria() {
    this.categoriaSelecionadaParaExcluir = null;
    this.categoriaSendoUsada = false;
    this.erroExclusaoCategoria = '';
  }

  confirmarExclusaoCategoria() {
    if (this.categoriaSelecionadaParaExcluir) {
      this.categorias = this.categorias.filter(c => c.id !== this.categoriaSelecionadaParaExcluir!.id);
      this.salvarCategorias();
    }
    this.cancelarExclusaoCategoria();
  }

  obterCorCategoria(nomeCategoria: string): string {
    const cat = this.categorias.find(c => c.nome === nomeCategoria);
    return cat ? cat.cor : '#6b7280';
  }
}