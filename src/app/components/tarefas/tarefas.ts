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

  novaTarefa = { titulo: '', descricao: '', data: '' };
  tarefas: any[] = [];

  tarefaSelecionadaParaExcluir: any = null;
  tarefaEditando: any = null;
  modoEdicao = false;

  formEdicaoAtual: NgForm | null = null;
  tarefaConfirmacaoEdicao: any = null;

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


  // ----- TEMA -----
  temaClaro = false;

  aba: 'login' | 'cadastro' | 'config' | 'cadastrar' | 'todas' | 'concluidas' | 'abertas' = 'login';

  constructor() {
    this.carregarUsuarios();
    this.carregarLocalStorage();
    this.carregarTema();

    const emailLogado = localStorage.getItem("usuarioLogadoEmail");
    if (emailLogado) {
      const user = this.usuarios.find(u => u.email === emailLogado);
      if (user) {
        this.usuarioLogado = user;
        this.aba = 'cadastrar';
        this.carregarLocalStorage(); // carrega tarefas do usuário logado
      } else {
        this.aba = 'login';
      }
    } else {
      this.aba = 'login';
    }
  }

  // ---- ABA ----
  mudarAba(nome: any) {
    if (nome === 'cadastro') {
      this.usuario = { nome: '', sobrenome: '', idade: '', email: '', senha: '' };
      this.resetErrosCadastro();
    }
    this.aba = nome;
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

    // Valida cada campo
    this.erroNome = !this.usuario.nome.trim();
    this.erroSobrenome = !this.usuario.sobrenome.trim();
    this.erroIdade = !this.usuario.idade || isNaN(Number(this.usuario.idade));
    this.erroEmail = !this.usuario.email.includes('@');
    this.erroSenha = !this.usuario.senha || this.usuario.senha.length < 5;

    // Verifica email duplicado
    this.erroEmailExistente = this.usuarios.some(u => u.email === this.usuario.email);

    if (this.erroNome || this.erroSobrenome || this.erroIdade || this.erroEmail || this.erroSenha || this.erroEmailExistente) {
      return; // Não cadastra se houver erros
    }

    // Adiciona novo usuário
    this.usuarios.push({ ...this.usuario });
    localStorage.setItem("usuarios", JSON.stringify(this.usuarios));

    // Limpa formulário e vai para login
    this.usuario = { nome: '', sobrenome: '', idade: '', email: '', senha: '' };
    this.mudarAba('login');
  }

  carregarUsuarios() {
    const dados = localStorage.getItem("usuarios");
    this.usuarios = dados ? JSON.parse(dados) : [];
  }

  // ---- LOGIN ----
  login() {
    const usuariosCadastrados = JSON.parse(localStorage.getItem("usuarios") || "[]");
    const usuarioEncontrado = usuariosCadastrados.find((u: any) => u.email === this.loginEmail);

    // Feedback único de erro
    if (!usuarioEncontrado || this.loginSenha !== usuarioEncontrado.senha) {
      this.erroLoginEmail = true;
      this.erroLoginSenha = true;
      return;
    }

    // Login válido
    this.usuarioLogado = usuarioEncontrado;
    localStorage.setItem("usuarioLogadoEmail", usuarioEncontrado.email);
    this.mudarAba('cadastrar');
  }




  sair() {
    this.usuarioLogado = null;
    localStorage.removeItem("usuarioLogadoEmail"); // remove persistência
    this.aba = 'login';
    this.tarefas = []; // limpa tarefas visíveis
  }


  // ---- TEMA ----
  carregarTema() {
    const t = localStorage.getItem("tema");
    if (t === 'claro') this.temaClaro = true;
  }

  alternarTema() {
    this.temaClaro = !this.temaClaro;
    localStorage.setItem("tema", this.temaClaro ? 'claro' : 'escuro');
  }

  // ---- TAREFAS ----
  adicionarTarefa(form: NgForm) {
    if (!this.usuarioLogado) {
      this.erroLoginObrigatorio = true; // flag para mostrar o alert
      this.mudarAba('login');
      return;
    }

    if (form.invalid || this.novaTarefa.titulo.trim().length < 3) {
      this.erroTarefaInvalida = true; // flag para alert bootstrap se quiser
      return;
    }

    this.tarefas.push({ ...this.novaTarefa, concluida: false });
    this.salvarLocalStorage();
    form.resetForm();
    this.novaTarefa = { titulo: '', descricao: '', data: '' };
  }


  salvarLocalStorage() {
    if (!this.usuarioLogado) return;
    localStorage.setItem(`tarefas_${this.usuarioLogado.email}`, JSON.stringify(this.tarefas));
  }

  carregarLocalStorage() {
    if (!this.usuarioLogado) return;
    const d = localStorage.getItem(`tarefas_${this.usuarioLogado.email}`);
    this.tarefas = d ? JSON.parse(d) : [];
  }

  // ---- EDIÇÃO ----
  editarTarefa(t: any) { this.modoEdicao = true; this.tarefaEditando = t; this.novaTarefa = { ...t }; this.mudarAba('cadastrar'); }
  solicitarConfirmacaoEdicao(form: NgForm) { if (form.invalid) return; this.tarefaConfirmacaoEdicao = { ...this.novaTarefa }; this.formEdicaoAtual = form; }
  confirmarEdicao() { if (!this.formEdicaoAtual || !this.tarefaEditando) return; Object.assign(this.tarefaEditando, this.tarefaConfirmacaoEdicao); this.salvarLocalStorage(); this.formEdicaoAtual.resetForm(); this.cancelarEdicao(); this.tarefaConfirmacaoEdicao = null; this.formEdicaoAtual = null; this.mudarAba('todas'); }
  cancelarConfirmacaoEdicao() { this.tarefaConfirmacaoEdicao = null; }
  cancelarEdicao() { this.modoEdicao = false; this.tarefaEditando = null; this.novaTarefa = { titulo: '', descricao: '', data: '' }; this.formEdicaoAtual = null; }

  alternarStatus(i: number) { this.tarefas[i].concluida = !this.tarefas[i].concluida; this.salvarLocalStorage(); }

  confirmarExclusao(t: any) { this.tarefaSelecionadaParaExcluir = t; }
  cancelarExclusao() { this.tarefaSelecionadaParaExcluir = null; }
  excluirDefinitivo() { this.tarefas = this.tarefas.filter(t => t !== this.tarefaSelecionadaParaExcluir); this.salvarLocalStorage(); this.cancelarExclusao(); }

  tarefasFiltradas() {
    if (this.aba === 'concluidas') return this.tarefas.filter(t => t.concluida);
    if (this.aba === 'abertas') return this.tarefas.filter(t => !t.concluida);
    return this.tarefas;
  }
}
