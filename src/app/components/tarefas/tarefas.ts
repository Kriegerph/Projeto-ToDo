import { Component, NgZone, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, onAuthStateChanged, updateEmail, updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from '@angular/fire/auth';
import { Firestore, collection, doc, setDoc, getDoc, collectionData, query, deleteDoc, updateDoc, where, getDocs, arrayRemove } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { Chart, registerables } from 'chart.js';
import moment from 'moment';

Chart.register(...registerables);

// ---------------------------------------------------------------------------------------
// ADIÇÃO 1/4: DEFINIÇÃO LOCAL DAS INTERFACES (PARA RESOLVER O ERRO 'Cannot find name Tarefa')
// ---------------------------------------------------------------------------------------
export interface Categoria {
  nome: string;
  cor: string;
}

export interface Tarefa {
  id: string; // Crucial para operações de update/delete
  titulo: string;
  descricao: string;
  data: string; // Formato DD/MM/YYYY
  prioridade: 'Baixa' | 'Média' | 'Alta';
  categoria?: Categoria; // Opcional
  concluida: boolean;
  dataConclusao?: string; // Formato DD/MM/YYYY
  usuarioUid: string;
}
// ---------------------------------------------------------------------------------------


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
  perfil: any = { nome: '', sobrenome: '', email: '', senhaAtual: '' };
  tarefas: any[] = [];

  termoPesquisa: string = '';

  // ----- CATEGORIAS -----
  categorias: any[] = [];
  novaCategoria = { nome: '', cor: '#563d7c' };
  categoriaSendoUsada = false;
  erroExclusaoCategoria = '';
  erroNomeCategoria = false;

  // Variáveis de Edição de Tarefas
  tarefaSelecionadaParaExcluir: any = null;
  tarefaEditando: any = null;
  modoEdicao = false;
  formEdicaoAtual: NgForm | null = null;
  tarefaConfirmacaoEdicao: any = null;
  alertTarefaSalva = false;

  // Variáveis de Edição de Categorias
  categoriaEditando: any = null;
  modoEdicaoCategoria: boolean = false;
  categoriaSelecionadaParaExcluir: any = null;

  // Variáveis de Configurações
  mostrarEdicaoPerfil: boolean = false;
  mostrarAlteracaoLogin: boolean = false;
  novaSenha: string = '';
  confirmaNovaSenha: string = '';
  novoEmail: string = '';
  mostrarModalLimpeza: boolean = false;
  tarefasExcluidas: any[] = [];
  limpezaContador: number = 0;
  alertaLimpezaVazia: boolean = false;
  mostrarModalExcluirConta: boolean = false;
  senhaParaExcluir: string = '';
  erroExcluirConta: string = '';
  contaExcluidaSucesso: boolean = false;
  deletandoConta: boolean = false;
  isLoading: boolean = false;
  isExcluindoConta: boolean = false;

  // ----- VISIBILIDADE DE SENHA -----
  mostrarSenhaLogin: boolean = false;
  mostrarSenhaCadastro: boolean = false; // Mantida para o switch
  mostrarSenhaAlterar: boolean = false;
  mostrarSenhaConfirmarAlterar: boolean = false;
  mostrarSenhaConfirmacao: boolean = false; // Mantida para o switch
  mostrarSenhaExclusao: boolean = false;

  // ----- USUÁRIOS/LOGIN -----
  usuario = { nome: '', sobrenome: '', idade: '', email: '', senha: '' };
  loginEmail = '';
  loginSenha = '';
  usuarioLogado: any = null;
  usuarioFirebase: User | null = null;

  // ----- ERROS & MENSAGENS -----
  erroLoginEmail = false;
  erroLoginSenha = false;
  erroNome = false;
  erroSobrenome = false;
  erroIdade = false;
  erroEmail = false;
  erroSenha = false;
  erroEmailExistente = false;
  erroNomeObrigatorio: boolean = false;
  erroSobrenomeObrigatorio: boolean = false;
  erroLoginEmailInvalido: boolean = false;
  erroLoginSenhaPequena: boolean = false;
  erroLoginSenhasDiferentes: boolean = false;
  erroLoginSenhaIgualAtual: boolean = false;
  erroLoginSenhaAtualIncorreta: boolean = false;
  msgSucessoLogin: string = '';
  msgSucessoPerfil: string = '';
  msgErroPerfil: string = '';
  msgErroReautenticacao: string = '';
  // Variáveis de Cadastro
  erroCadastroSenha: boolean = false;
  erroFormIncompleto: boolean = false;
  erroTarefaInvalida = false; // Necessária para o formulário de tarefa

  // Variáveis de Filtro
  filtroData: string = '';
  filtroPrioridade: string = '';
  filtroCategoria: string = '';

  // ---------------------------------------------------------------------------------------
  // ADIÇÃO 2/4: VARIÁVEIS DE ESTADO DO PAINEL HOME E LIXEIRA
  // ---------------------------------------------------------------------------------------
  // Variáveis do Painel Home
  tarefasDoDia: Tarefa[] = [];
  contadoresPainel: any = { atrasadas: 0, hoje: 0, concluidasHoje: 0 };
  chartCategorias: Chart | null = null;
  chartPrioridades: Chart | null = null;
  chartCategoriasId = 'chartCategorias';
  chartPrioridadesId = 'chartPrioridades';

  // ----- TEMA -----
  temaClaro = false;

  // ----- RESPONSIVIDADE -----
  sidebarAberta = false;

  // ----- NAVEGAÇÃO -----
  aba: 'login' | 'cadastro' | 'config' | 'cadastrar' | 'todas' | 'concluidas' | 'abertas' | 'categorias' | 'ajuda' = 'login';

  // ----- AJUDA -----
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
      id: 'edicao-perfil',
      pergunta: 'Edição de Perfil, Senha e Exclusão',
      conteudo: '<h4>Edição de Dados Pessoais</h4><p>Na aba <b>Configurações</b>, você pode atualizar seu Nome, Sobrenome e Email. Para salvar qualquer alteração de dados, você deve fornecer sua <b>Senha Atual</b>.</p>'
    },
    {
      id: 'novaTarefa',
      pergunta: 'Adicionar e Editar Tarefas',
      conteudo: '<p>Para criar uma nova tarefa, vá em <b>Nova Tarefa</b>:</p><ul><li>Preencha o <b>Título</b> (mínimo 3 caracteres) e a <b>Data</b> (obrigatórios).</li><li>Defina a <b>Prioridade</b> (Baixa, Média, Alta) e selecione a <b>Categoria</b>.</li><li>Clique em <b>Cadastrar</b>.</li></ul><p>Para editar, clique no ícone de lápis (<i class="bi bi-pencil"></i>) na lista de tarefas; você será levado de volta à aba de cadastro para fazer as alterações.</p>'
    },
    {
      id: 'listagem-tarefas',
      pergunta: 'Listar e Gerenciar Tarefas',
      conteudo: '<p>A tela principal exibe suas tarefas em uma tabela. Aqui você pode:</p><ul><li><b>Alternar status:</b> Clique no <b>switch</b> ao lado de uma tarefa para marcar/desmarcar como concluída.</li><li><b>Editar:</b> Use o ícone de lápis (<i class="bi bi-pencil"></i>).</li><li><b>Excluir:</b> Use o ícone de lixeira (<i class="bi bi-trash"></i>).</li></ul><p>Use os botões na lateral para ver apenas tarefas <b>Concluídas</b> ou <b>Abertas</b>.</p>'
    },
    {
      id: 'filtros-avancados',
      pergunta: 'Filtragem e Pesquisa',
      conteudo: '<p>Para encontrar rapidamente tarefas específicas, use os controles de filtro no topo da listagem:</p><ul><li><b>Pesquisa:</b> Use o campo de busca principal para filtrar por <b>Título</b> ou <b>Descrição</b> da tarefa.</li><li><b>Filtros Avançados:</b> Use o painel de filtros abaixo para refinar os resultados por:</li><ul><li><b>Data:</b> Selecione uma data específica de vencimento.</li><li><b>Prioridade:</b> Escolha Baixa, Média ou Alta.</li><li><b>Categoria:</b> Filtre por categorias criadas por você.</li></ul></ul><p>Clique em <b>Limpar Todos os Filtros</b> para resetar a pesquisa e a filtragem avançada.</p>'
    },
    {
      id: 'status',
      pergunta: 'Alternar o Status (Concluído)',
      conteudo: '<p>Para marcar uma tarefa como concluída (ou reabri-la), utilize o seletor (checkbox/switch) na coluna <b>Status</b> da tabela.</p><p>O status é salvo automaticamente. Tarefas concluídas aparecem com a linha riscada.</p>'
    },
    {
      id: 'categorias',
      pergunta: 'Gerenciar Categorias',
      conteudo: '<p>Vá em <b>Categorias</b> para criar e organizar as etiquetas de suas tarefas.</p><ul><li>Para <b>Adicionar</b> uma nova, preencha o Nome e a Cor e clique em <b>Adicionar</b>.</li><li>Para <b>Editar</b>, clique no ícone de lápis (<i class="bi bi-pencil"></i>) ao lado da categoria na lista. O formulário será preenchido para você fazer as alterações e clicar em <b>Salvar Alterações</b>.</li></ul><p><b>Atenção:</b> Uma categoria só pode ser excluída (<i class="bi bi-trash"></i>) se <b>não houver nenhuma tarefa vinculada a ela</b>.</p>'
    },
    {
      id: 'config',
      pergunta: 'Configurações e Tema',
      conteudo: '<p>Na aba <b>Configurações</b>, você pode ver seus dados de perfil e alterar o visual do site:</p><ul><li>Clique em <b>Tema</b> para alternar entre o Tema Claro e o Tema Escuro.</li><li>Use o botão <b>Sair</b> para desconectar da conta e proteger suas tarefas.</li></ul>'
    },
    {
      id: 'exclusao-conta',
      pergunta: 'Exclusão Permanente da Conta',
      conteudo: '<p>Para excluir permanentemente sua conta e todos os dados associados, acesse a <b>Configuração de Perfil</b> e localize a opção de exclusão.</p><ul><li>É obrigatório fornecer a <b>senha atual</b> para confirmar a exclusão.</li><li>Após clicar em <b>Excluir Permanentemente</b>, o botão mudará para <b>Excluindo...</b> para indicar o processamento. Não feche a aplicação neste momento.</li></ul><p>Após a exclusão bem-sucedida, você será redirecionado para a tela de Login.</p>'
    }
  ];

  // Variável que será a fonte de dados em tempo real
  tarefasObservable!: Observable<any[]>;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.carregarTema();
    document.body.classList.toggle("tema-claro", this.temaClaro);

    // ESCUTAR PAR�METROS DA URL
    this.route.queryParams.subscribe(params => {
      if (params['excluido'] === 'true') {
        this.zone.run(() => {
          this.contaExcluidaSucesso = true;
          this.aba = 'login';
          this.cdr.detectChanges();

          setTimeout(() => {
            this.contaExcluidaSucesso = false;
            this.router.navigate([], { queryParams: { excluido: null }, queryParamsHandling: 'merge' });
            this.cdr.detectChanges();
          }, 8000);
        });
      }
    });

    onAuthStateChanged(this.auth, (user) => {
      if (this.deletandoConta) return;

      this.zone.run(() => {
        this.usuarioFirebase = user;
        if (user) {
          this.usuarioLogado = { email: user.email, nome: user.displayName || 'Usuário' };
          this.carregarPerfil();
          this.carregarDadosUsuario(user.uid);
          if (this.aba === 'login' || this.aba === 'cadastro') {
            this.aba = 'cadastrar';
          }
        } else {
          this.usuarioLogado = null;
          if (!this.contaExcluidaSucesso) this.aba = 'login';
          this.tarefas = [];
          this.categorias = [];
        }
        this.cdr.detectChanges();
      });
    });
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
      this.cancelarEdicaoCategoria();
    }

    // Define um tópico padrão ao entrar na aba ajuda.
    if (nome === 'ajuda') {
      if (this.aba !== 'ajuda') {
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
      this.topicoAjudaAtivo = '';
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

  async salvarUsuario() {
    this.erroEmailExistente = false;
    this.erroCadastroSenha = false;
    this.erroFormIncompleto = false;
    this.isLoading = false;

    if (!this.usuario.nome || !this.usuario.email || !this.usuario.senha) {
      this.zone.run(() => {
        this.erroFormIncompleto = true;
        this.cdr.detectChanges();
      });
      return;
    }

    if (this.usuario.senha.length < 6) {
      this.zone.run(() => {
        this.erroCadastroSenha = true;
        this.cdr.detectChanges();
      });
      return;
    }

    this.zone.run(() => {
      this.isLoading = true;
      this.cdr.detectChanges();
    });

    try {
      const credencial = await createUserWithEmailAndPassword(
        this.auth,
        this.usuario.email,
        this.usuario.senha
      );

      const user = credencial.user;

      if (user) {
        const userDocRef = doc(this.firestore, 'users', user.uid);
        await setDoc(userDocRef, {
          nome: this.usuario.nome,
          sobrenome: this.usuario.sobrenome,
          idade: this.usuario.idade,
          email: this.usuario.email,
          createdAt: new Date()
        });
        console.log("Perfil do usuário salvo no Firestore.");
      }

      this.zone.run(() => {
        this.usuario = { nome: '', sobrenome: '', idade: '', email: '', senha: '' };
        this.isLoading = false;
        this.cdr.detectChanges();
      });

    } catch (error: any) {
      this.zone.run(() => {
        this.isLoading = false;

        if (error.code === 'auth/email-already-in-use') {
          this.erroEmailExistente = true;
        } else {
          console.error("Erro no cadastro:", error);
        }

        this.cdr.detectChanges();
      });
    }
  }

  async carregarPerfil() {
    this.msgSucessoPerfil = '';
    this.msgErroPerfil = '';

    const currentUser = this.auth.currentUser;

    if (currentUser) {
      const userDocRef = doc(this.firestore, 'users', currentUser.uid);
      const docSnap = await getDoc(userDocRef);

      this.zone.run(() => {
        if (docSnap.exists()) {
          const dadosPerfil = docSnap.data();

          this.perfil = {
            nome: dadosPerfil['nome'] || '',
            sobrenome: dadosPerfil['sobrenome'] || '',
            idade: dadosPerfil['idade'] || '',
            email: currentUser.email,
            senhaAtual: ''
          };
        } else {
          this.perfil = {
            nome: '',
            sobrenome: '',
            idade: '',
            email: currentUser.email,
            senhaAtual: ''
          };
        }
        this.cdr.detectChanges();
      });
    }
  }

  // ---- LOGIN ----
  async login() {
    this.erroLoginEmail = false;
    this.erroLoginSenha = false;
    let formInvalido = false;

    if (!this.loginEmail || this.loginEmail.trim() === '') {
      this.erroLoginEmail = true;
      formInvalido = true;
    }
    if (!this.loginSenha || this.loginSenha.trim() === '') {
      this.erroLoginSenha = true;
      formInvalido = true;
    }

    if (formInvalido) {
      this.zone.run(() => {
        this.cdr.detectChanges();
      });
      return;
    }

    this.zone.run(() => {
      this.isLoading = true;
      this.cdr.detectChanges();
    });

    try {
      await signInWithEmailAndPassword(
        this.auth,
        this.loginEmail,
        this.loginSenha
      );

      this.zone.run(() => {
        this.loginEmail = '';
        this.loginSenha = '';
        this.isLoading = false;
        this.cdr.detectChanges();
      });

    } catch (error: any) {
      this.zone.run(() => {
        this.isLoading = false;

        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          this.erroLoginEmail = true;
          this.erroLoginSenha = true;
        } else {
          console.error("Erro no login:", error);
        }

        this.cdr.detectChanges();
      });
    }
  }

  async salvarAlteracoesPerfil() {
    this.msgSucessoPerfil = '';
    this.msgErroPerfil = '';
    this.erroNomeObrigatorio = false;
    this.erroSobrenomeObrigatorio = false;

    this.cdr.detectChanges();

    let formValido = true;
    if (!this.perfil.nome || this.perfil.nome.trim() === '') {
      this.erroNomeObrigatorio = true;
      formValido = false;
    }
    if (!this.perfil.sobrenome || this.perfil.sobrenome.trim() === '') {
      this.erroSobrenomeObrigatorio = true;
      formValido = false;
    }

    if (!formValido) {
      this.zone.run(() => {
        this.cdr.detectChanges();
      });
      return;
    }

    const currentUser = this.auth.currentUser;
    if (currentUser) {
      try {
        const userDocRef = doc(this.firestore, 'users', currentUser.uid);

        await setDoc(userDocRef, {
          nome: this.perfil.nome,
          sobrenome: this.perfil.sobrenome
        }, { merge: true });

        this.zone.run(async () => {
          this.msgSucessoPerfil = 'Perfil atualizado com sucesso!';
          this.msgErroPerfil = '';

          await this.carregarDadosUsuario(currentUser.uid);

          this.cdr.detectChanges();

          setTimeout(() => {
            this.zone.run(() => {
              this.msgSucessoPerfil = '';
              this.cdr.detectChanges();
            });
          }, 3000);
        });

      } catch (error) {
        this.zone.run(() => {
          this.msgErroPerfil = 'Erro ao salvar o perfil.';
          this.msgSucessoPerfil = '';
          console.error("Erro ao salvar perfil:", error);
          this.cdr.detectChanges();
        });
      }
    }
  }

  async alterarLogin() {
    this.msgSucessoLogin = '';
    this.msgErroReautenticacao = '';
    this.erroLoginEmailInvalido = false;
    this.erroLoginSenhaPequena = false;
    this.erroLoginSenhasDiferentes = false;
    this.erroLoginSenhaIgualAtual = false;
    this.erroLoginSenhaAtualIncorreta = false;
    this.cdr.detectChanges();

    const currentUser = this.auth.currentUser;
    if (!currentUser) return;

    const emailMudou = this.novoEmail.trim() !== '' && this.novoEmail.trim() !== currentUser.email;
    const senhaMudou = this.novaSenha.trim() !== '';

    let formValido = true;

    // ----------------------------------------------------------------
    // A) VALIDAÇÕES DO FORMULÁRIO (Frontend)
    // ----------------------------------------------------------------

    if (emailMudou) {
      if (!this.novoEmail.includes('@')) {
        this.erroLoginEmailInvalido = true;
        formValido = false;
      }
    }

    if (senhaMudou) {
      if (this.novaSenha.length < 6) {
        this.erroLoginSenhaPequena = true;
        formValido = false;
      }
      if (this.novaSenha !== this.confirmaNovaSenha) {
        this.erroLoginSenhasDiferentes = true;
        formValido = false;
      }
    }

    if (!this.perfil.senhaAtual || this.perfil.senhaAtual.trim() === '') {
      this.msgErroReautenticacao = 'A senha atual é obrigatória para qualquer alteração.';
      formValido = false;
    }

    if (!formValido) {
      this.zone.run(() => this.cdr.detectChanges());
      return;
    }

    // ----------------------------------------------------------------
    // B) RE-AUTENTICAÇÃO (Obrigatório)
    // ----------------------------------------------------------------
    const credencial = EmailAuthProvider.credential(currentUser.email!, this.perfil.senhaAtual);

    try {
      await reauthenticateWithCredential(currentUser, credencial);

      let mensagem = "Login atualizado com sucesso. ";

      if (emailMudou) {
        await updateEmail(currentUser, this.novoEmail);
        this.perfil.email = this.novoEmail;
        mensagem += "O E-mail foi alterado. ";
      }

      if (senhaMudou) {
        if (this.novaSenha === this.perfil.senhaAtual) {
          this.erroLoginSenhaIgualAtual = true;
          this.zone.run(() => this.cdr.detectChanges());
          return;
        }

        await updatePassword(currentUser, this.novaSenha);
        mensagem += "A Senha foi alterada. ";
      }

      // 4. Feedback de Sucesso e Limpeza
      this.zone.run(() => {
        this.msgSucessoLogin = mensagem;
        this.perfil.senhaAtual = '';
        this.novaSenha = '';
        this.confirmaNovaSenha = '';
        this.novoEmail = '';

        this.cdr.detectChanges();

        setTimeout(() => {
          this.zone.run(() => {
            this.msgSucessoLogin = '';
            this.cdr.detectChanges();
          });
        }, 3000);
      });

    } catch (error: any) {
      // 5. Tratamento de Erros do Firebase
      this.zone.run(() => {
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          this.erroLoginSenhaAtualIncorreta = true;
          this.msgErroReautenticacao = 'A senha atual fornecida está incorreta. Tente novamente.';
        } else {
          this.msgErroReautenticacao = `Erro ao atualizar login: ${error.message}`;
          console.error("Erro ao atualizar login:", error);
        }
        this.cdr.detectChanges();
      });
    }
  }

  // Funções para controle de collapse exclusivo
  toggleEdicaoPerfil() {
    this.mostrarEdicaoPerfil = !this.mostrarEdicaoPerfil;
    if (this.mostrarEdicaoPerfil) {
      this.mostrarAlteracaoLogin = false;
    }
    this.cdr.detectChanges();
  }

  toggleAlteracaoLogin() {
    this.mostrarAlteracaoLogin = !this.mostrarAlteracaoLogin;
    if (this.mostrarAlteracaoLogin) {
      this.mostrarEdicaoPerfil = false;
    }
    this.cdr.detectChanges();
  }

  // ---- SAIR ----
  async sair() {
    try {
      await signOut(this.auth);
      this.resetarEstadoGeral();
      this.cdr.detectChanges();
    } catch (error) {
      console.error("Erro ao sair:", error);
      this.cdr.detectChanges();
    }
  }

  abrirModalExcluir() {
    this.senhaParaExcluir = '';
    this.erroExcluirConta = '';
    this.mostrarModalExcluirConta = true;
    this.cdr.detectChanges();
  }

  async confirmarExclusaoConta() {
    const user = this.auth.currentUser;
    if (!user || !this.senhaParaExcluir) return;

    this.deletandoConta = true;
    this.erroExcluirConta = '';

    try {
      // 1. RE-AUTENTICAÇÃO
      const credential = EmailAuthProvider.credential(user.email!, this.senhaParaExcluir);
      await reauthenticateWithCredential(user, credential);

      // 2. LIMPEZA DOS DADOS NO FIRESTORE
      const tarefasRef = collection(this.firestore, `users/${user.uid}/tarefas`);
      const tarefasSnap = await getDocs(tarefasRef);
      const promessas = tarefasSnap.docs.map(d => deleteDoc(d.ref));

      await Promise.all([
        ...promessas,
        deleteDoc(doc(this.firestore, 'categorias', user.uid)),
        deleteDoc(doc(this.firestore, 'users', user.uid))
      ]);

      // 3. DELETAR O USUÁRIO DO AUTH
      await deleteUser(user);

      this.resetarEstadoGeral();

      // 4. FINALIZAÇÃO E REDIRECIONAMENTO
      this.zone.run(() => {
        this.mostrarModalExcluirConta = false;
        this.senhaParaExcluir = '';
        this.deletandoConta = false;

        this.router.navigate([], {
          queryParams: { excluido: 'true' },
          queryParamsHandling: 'merge'
        });
      });

    } catch (error: any) {
      this.deletandoConta = false;
      this.zone.run(() => {
        console.error("Erro na exclusão:", error.code);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          this.erroExcluirConta = "Senha incorreta.";
        } else if (error.code === 'auth/requires-recent-login') {
          this.erroExcluirConta = "Sessão expirada. Refaça o login para excluir sua conta.";
        } else {
          this.erroExcluirConta = "Não foi possível excluir. Verifique sua conexão.";
        }
        this.cdr.detectChanges();
      });
    }
  }

  irParaLogin() {
    this.contaExcluidaSucesso = false;
    this.mostrarModalExcluirConta = false;
    this.router.navigate(['/']);
  }

  resetarEstadoGeral() {
    this.zone.run(() => {
      // 1. Limpa dados de usuário e autenticação
      this.usuarioFirebase = null;
      this.usuarioLogado = null;
      this.perfil = { nome: '', sobrenome: '', email: '', senhaAtual: '' };

      // 2. Limpa listas de dados
      this.tarefas = [];
      this.categorias = [];
      this.tarefasExcluidas = [];

      // 3. Reseta estados da interface
      this.aba = 'login';
      this.sidebarAberta = false;
      this.mostrarModalExcluirConta = false;
      this.deletandoConta = false;
      this.isLoading = false;

      // 4. Limpa formulários
      this.loginEmail = '';
      this.loginSenha = '';
      this.senhaParaExcluir = '';
      this.novaTarefa = { titulo: '', descricao: '', data: '', prioridade: 'media', categoria: '' };
      this.novaCategoria = { nome: '', cor: '#563d7c' };
      this.cancelarEdicaoCategoria(); // Reseta estados de categoria

      // 5. Força o Angular a redesenhar a tela "vazia"
      this.cdr.detectChanges();
    });
  }

  // A função 'abrirModal' original estava vazia, foi removida.

  async executarLimpeza() {
    const currentUser = this.auth.currentUser;
    if (!currentUser) return;

    this.tarefasExcluidas = [];
    this.limpezaContador = 0;
    this.cdr.detectChanges();

    const tarefasRef = collection(this.firestore, `users/${currentUser.uid}/tarefas`);
    const q = query(tarefasRef, where("concluida", "==", true));

    try {
      const querySnapshot = await getDocs(q);

      const promessasDelecao: Promise<void>[] = [];

      querySnapshot.forEach((doc) => {
        const dadosTarefa = doc.data();

        this.tarefasExcluidas.push({
          id: doc.id,
          nome: dadosTarefa['titulo'] || 'Tarefa sem nome'
        });

        promessasDelecao.push(deleteDoc(doc.ref));
      });

      await Promise.all(promessasDelecao);

      this.zone.run(() => {
        this.limpezaContador = this.tarefasExcluidas.length;
        // O observable cuidará de atualizar a lista this.tarefas
        this.cdr.detectChanges();
      });

    } catch (error) {
      this.zone.run(() => {
        this.fecharModalLimpeza();
        console.error("Erro ao limpar tarefas concluídas:", error);
      });
    }
  }

  abrirModalLimpeza() {
    if (!this.auth.currentUser) return;

    this.limpezaContador = 0;
    this.tarefasExcluidas = [];
    this.alertaLimpezaVazia = false;

    const tarefasConcluidas = this.tarefas.filter(t => t.concluida === true);

    if (tarefasConcluidas.length === 0) {
      this.alertaLimpezaVazia = true;
    } else {
      this.alertaLimpezaVazia = false;
    }

    this.mostrarModalLimpeza = true;
    this.cdr.detectChanges();
  }

  fecharModalLimpeza() {
    this.mostrarModalLimpeza = false;
    this.cdr.detectChanges();
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

  // 2. LÓGICA CONCRETA PARA MARCAR TAREFA COMO CONCLUÍDA NO FIRESTORE (CORRIGIDO: Removido tarefasService)
  async marcarTarefaComoConcluida(tarefa: Tarefa): Promise<void> {
    if (!this.usuarioFirebase || !this.usuarioFirebase.uid || !tarefa.id) {
      console.error("Erro: Usuário não logado ou ID da tarefa ausente.");
      return;
    }

    const novoEstadoConcluida = !tarefa.concluida;
    // Formata a data de conclusão apenas se estiver sendo concluída
    const dataConclusao = novoEstadoConcluida ? moment().format('DD/MM/YYYY') : '';

    const dadosAtualizados = {
      concluida: novoEstadoConcluida,
      dataConclusao: dataConclusao
    };

    // --- CORREÇÃO: Usa this.firestore e updateDoc diretamente ---
    try {
      const tarefaDocRef = doc(this.firestore, `users/${this.usuarioFirebase.uid}/tarefas/${tarefa.id}`);
      await updateDoc(tarefaDocRef, dadosAtualizados);

      this.zone.run(() => {
        // O observable já faz a atualização, mas para garantir a UI imediata:
        this.tarefasFiltradas();
      });

    } catch (error: any) {
      console.error("Erro ao atualizar o status de conclusão da tarefa no Firestore:", error);
    }
  }

  // 5. FUNÇÃO AUXILIAR
  getPrioridadeClass(prioridade: string): string {
    switch (prioridade) {
      case 'Alta': return 'bg-danger text-white';
      case 'Média': return 'bg-warning text-dark';
      case 'Baixa': return 'bg-info text-white';
      default: return 'bg-secondary text-white';
    }
  }

  // ---------------------------------------------------------------------------------------
  // CORREÇÕES NOS MÉTODOS EXISTENTES
  // ---------------------------------------------------------------------------------------

  // ---- TAREFAS: ADICIONAR/CADASTRAR ----
  async adicionarTarefa(form: NgForm) {
    if (!this.usuarioFirebase || form.invalid) {
      this.erroTarefaInvalida = true;
      setTimeout(() => this.erroTarefaInvalida = false, 3000);
      return;
    }

    try {
      const tarefasRef = collection(this.firestore, `users/${this.usuarioFirebase.uid}/tarefas`);

      // Garante que a categoria seja um objeto Categoria se houver uma, se não, é string vazia.
      const categoriaObj = this.categorias.find(c => c.nome === this.novaTarefa.categoria);

      await setDoc(doc(tarefasRef), {
        ...this.novaTarefa,
        // Adiciona a estrutura da categoria (nome e cor)
        categoria: categoriaObj ? { nome: categoriaObj.nome, cor: categoriaObj.cor } : null,
        concluida: false,
        criadoEm: new Date().toISOString()
      });

      form.resetForm();
      this.novaTarefa = { titulo: '', descricao: '', data: '', prioridade: 'media', categoria: '' };
      this.exibirAlertTarefaSalva();

    } catch (e) {
      console.error("Erro ao adicionar tarefa: ", e);
    }
  }

  // ---------------------------------------------------------------------------------------
  // CORREÇÃO: Método carregarTarefas - Removido this.tarefasService
  // ---------------------------------------------------------------------------------------
  // Este método não é mais necessário porque você já está usando tarefasObservable
  // no carregarDadosUsuario, mas vou mantê-lo vazio para não gerar erros de referência
  carregarTarefas(): void {
    if (!this.usuarioFirebase || !this.usuarioFirebase.uid) return;

    // O observable (tarefasObservable) já atualiza this.tarefas
    // Chamamos apenas o método do painel para garantir que ele se atualize
    this.cdr.detectChanges();
  }


  // ---- PERSISTÊNCIA COMPLETA (Tarefas + Categorias) ----
  async carregarDadosUsuario(uid: string) {
    if (!uid) return;

    // --- CARREGAR DADOS DO PERFIL (Nome/Sobrenome) ---
    try {
      const userProfileRef = doc(this.firestore, `users/${uid}`);
      const docSnap = await getDoc(userProfileRef);

      this.zone.run(() => {
        if (docSnap.exists()) {
          const dados = docSnap.data();

          this.usuarioLogado = {
            ...this.usuarioLogado,
            nome: dados['nome'] || 'Usuário',
            sobrenome: dados['sobrenome'] || ''
          };
        }
        this.cdr.detectChanges();
      });
    } catch (e) {
      console.error("Erro ao carregar dados do perfil: ", e);
    }

    // --- CARREGAR CATEGORIAS (Via GET) ---
    try {
      const catRef = doc(this.firestore, `categorias/${uid}`);
      const docSnap = await getDoc(catRef);

      if (docSnap.exists()) {
        this.categorias = docSnap.data()['lista'] || [];
      } else {
        // Categorias Padrão para novos usuários
        this.categorias = [
          { nome: 'Trabalho', cor: '#0d6efd' },
          { nome: 'Pessoal', cor: '#198754' },
          { nome: 'Urgente', cor: '#dc3545' }
        ];
        // Salva as categorias padrão no Firestore
        await setDoc(catRef, { lista: this.categorias });
      }
    } catch (e) {
      console.error("Erro ao carregar categorias: ", e);
    }

    // --- CARREGAR TAREFAS (Via Realtime - Observable) ---
    const tarefasRef = collection(this.firestore, `users/${uid}/tarefas`);

    this.tarefasObservable = collectionData(tarefasRef, { idField: 'id' }) as Observable<any[]>;

    this.tarefasObservable.subscribe(tarefasDoBanco => {
      this.zone.run(() => {
        this.tarefas = tarefasDoBanco;
        this.tarefasFiltradas();
        this.cdr.detectChanges();
      });
    });
  }

  // NOVO MÉTODO: Salvar Categorias no Firebase
  async salvarCategoriasFirestore() {
    if (!this.usuarioFirebase) return;
    try {
      const catRef = doc(this.firestore, `categorias/${this.usuarioFirebase.uid}`);
      await setDoc(catRef, { lista: this.categorias });
    } catch (e) {
      console.error("Erro ao salvar categorias no Firestore: ", e);
    }
  }

  async adicionarCategoria() {
    if (!this.novaCategoria.nome.trim()) {
      this.erroNomeCategoria = true;
      this.cdr.detectChanges();
      return;
    }
    this.erroNomeCategoria = false;

    // Se estiver no modo de EDIÇÃO
    if (this.modoEdicaoCategoria && this.categoriaEditando) {
      this.categoriaEditando.nome = this.novaCategoria.nome;
      this.categoriaEditando.cor = this.novaCategoria.cor;

      await this.salvarCategoriasFirestore();

      this.cancelarEdicaoCategoria();

      // CORREÇÃO APLICADA: Força o recarregamento na primeira ação
      this.cdr.detectChanges();

    } else {
      // Se estiver ADICIONANDO
      if (!this.categorias.some(c => c.nome.toLowerCase() === this.novaCategoria.nome.toLowerCase())) {
        this.categorias.push({ ...this.novaCategoria });

        await this.salvarCategoriasFirestore();

        this.novaCategoria = { nome: '', cor: '#563d7c' };

        // CORREÇÃO APLICADA: Força o recarregamento na primeira ação
        this.cdr.detectChanges();
      }
    }
  }

  // Inicia o modo de edição (Chamado ao clicar no ícone de lápis)
  ativarEdicaoCategoria(categoria: any) {
    this.categoriaEditando = categoria;
    this.novaCategoria = { ...categoria };
    this.modoEdicaoCategoria = true;
  }

  // Cancela o modo de edição
  cancelarEdicaoCategoria() {
    this.categoriaEditando = null;
    this.modoEdicaoCategoria = false;
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
    const emUso = this.tarefas.some(t => {
      // Verifica se a categoria é um objeto ou string
      const nomeCategoriaTarefa = typeof t.categoria === 'object' && t.categoria !== null ? t.categoria.nome : t.categoria;
      return nomeCategoriaTarefa === cat.nome;
    });

    this.categoriaSendoUsada = false;
    this.erroExclusaoCategoria = '';

    if (emUso) {
      this.categoriaSendoUsada = true;
      this.erroExclusaoCategoria = `A categoria "${cat.nome}" não pode ser excluída pois há tarefas vinculadas a ela.`;
      setTimeout(() => {
        this.categoriaSendoUsada = false;
        this.cdr.detectChanges();
      }, 4000);
      return;
    }

    this.categoriaSelecionadaParaExcluir = cat;
    this.cdr.detectChanges();
  }

  async confirmarExclusaoCategoria() {
    const categoriaParaRemover = this.categoriaSelecionadaParaExcluir;

    // 1. Validação inicial
    if (!categoriaParaRemover || !this.usuarioFirebase || !this.usuarioFirebase.uid) {
      console.error("Erro: Categoria ou UID do usuário ausente para exclusão.");

      // Garantir que o modal feche mesmo em caso de erro de validação (primeiro clique)
      this.zone.run(() => {
        this.categoriaSelecionadaParaExcluir = null;
        this.cdr.detectChanges();
      });
      return;
    }

    const documentoPrincipalId = this.usuarioFirebase.uid;

    // O objeto deve ser IDENTICO ao que está no Firestore, por isso a recriação
    const objetoParaRemover = {
      cor: categoriaParaRemover.cor,
      nome: categoriaParaRemover.nome
    };

    try {
      const caminhoDoc = `categorias/${documentoPrincipalId}`;
      const docRef = doc(this.firestore, caminhoDoc);

      // 2. Chamada Assíncrona ao Firebase para remover a categoria
      await updateDoc(docRef, {
        lista: arrayRemove(objetoParaRemover)
      });

      // 3. Atualiza o estado local APÓS o sucesso do Firebase
      // Remove a categoria da lista local para que ela desapare�a do menu de categorias
      this.categorias = this.categorias.filter(c => c.nome !== categoriaParaRemover.nome);

      // 4. ATUALIZAÇÃO CRÍTICA
      // Devemos garantir que o estado do componente Angular seja refletido:
      this.zone.run(() => {

        // I. Fechar o modal de confirmação e limpar a variável
        this.categoriaSelecionadaParaExcluir = null;

        // II. Atualiza a exibição da lista de tarefas para remover as referências à categoria excluída
        // Esta chamada é CRÍTICA para que a lista de tarefas se atualize no mesmo ciclo.
        this.tarefasFiltradas();

        // III. Força a detecção de mudanças (bom para garantir)
        this.cdr.detectChanges();
      });

    } catch (error: any) {
      this.zone.run(() => {
        console.error("ERRO REAL NO FIRESTORE DURANTE A EXCLUSÃO:", error);
        this.categoriaSelecionadaParaExcluir = null;
        this.cdr.detectChanges();
      });
    }
  }

  cancelarExclusaoCategoria() {
    this.zone.run(() => {
      this.categoriaSelecionadaParaExcluir = null;
      this.cdr.detectChanges();
    });
  }

  obterCorCategoria(nomeCategoria: string): string {
    const cat = this.categorias.find(c => c.nome === nomeCategoria);
    return cat ? cat.cor : '#6c757d';
  }


  // ---- EDIÇÃO DE TAREFAS ----
  editarTarefa(t: any) {
    this.modoEdicao = true;
    this.tarefaEditando = t;

    // CORREÇÃO: Pega a categoria corretamente
    const nomeCategoria = t.categoria && t.categoria.nome ? t.categoria.nome : '';

    this.novaTarefa = {
      ...t,
      categoria: nomeCategoria // Define a categoria como string para o ngModel
    };

    this.mudarAba('cadastrar');
  }

  solicitarConfirmacaoEdicao(form: NgForm) {
    if (form.invalid) return;

    this.tarefaConfirmacaoEdicao = { ...this.novaTarefa };
    this.formEdicaoAtual = form;
  }

  async confirmarEdicao() {
    if (!this.formEdicaoAtual || !this.tarefaEditando || !this.usuarioFirebase || !this.tarefaEditando.id) return;

    const dadosAtualizados = { ...this.tarefaConfirmacaoEdicao };

    // Garante que a categoria seja um objeto Categoria (para salvar no Firestore)
    const categoriaObj = this.categorias.find(c => c.nome === dadosAtualizados.categoria);

    delete dadosAtualizados.id; // Remove o ID do objeto antes de salvar

    // Define a estrutura correta para a categoria no objeto de update
    const dadosFinais = {
      ...dadosAtualizados,
      categoria: categoriaObj ? { nome: categoriaObj.nome, cor: categoriaObj.cor } : null
    };


    try {
      const tarefaRef = doc(this.firestore, `users/${this.usuarioFirebase.uid}/tarefas/${this.tarefaEditando.id}`);

      await updateDoc(tarefaRef, dadosFinais);

      this.formEdicaoAtual.resetForm();
      this.tarefaConfirmacaoEdicao = null;
      this.cancelarEdicao();
      this.mudarAba('todas');

    } catch (e) {
      console.error("Erro ao confirmar edição: ", e);
    }
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

  async alternarStatus(tarefa: any) {
    // CORREÇÃO: Chama o novo método que usa this.firestore
    await this.marcarTarefaComoConcluida(tarefa);
  }

  confirmarExclusao(t: any) {
    this.tarefaSelecionadaParaExcluir = t;
    this.cdr.detectChanges();
  }

  cancelarExclusao() {
    this.tarefaSelecionadaParaExcluir = null;
    this.cdr.detectChanges();
  }

  async excluirDefinitivo() {
    if (!this.usuarioFirebase || !this.tarefaSelecionadaParaExcluir || !this.tarefaSelecionadaParaExcluir.id) return;

    try {
      const tarefaRef = doc(this.firestore, `users/${this.usuarioFirebase.uid}/tarefas/${this.tarefaSelecionadaParaExcluir.id}`);
      await deleteDoc(tarefaRef);

      this.tarefaSelecionadaParaExcluir = null;
      this.cdr.detectChanges();
    } catch (e) {
      console.error("Erro ao excluir tarefa: ", e);
      this.tarefaSelecionadaParaExcluir = null;
      this.cdr.detectChanges();
    }
  }

  // NOVO MÉTODO: Limpar todos os filtros
  limparTodosFiltros() {
    this.termoPesquisa = '';
    this.filtroData = '';
    this.filtroPrioridade = '';
    this.filtroCategoria = '';

    this.tarefasFiltradas();
  }

  // MÉTODO AJUSTADO PARA USAR filtroData
  tarefasFiltradas(): any[] {
    let lista = this.tarefas;

    // 1. FILTRAR POR ABA (Concluídas/Abertas/Lixeira)
    if (this.aba === 'concluidas') {
      lista = this.tarefas.filter(t => t.concluida);
    } else if (this.aba === 'abertas') {
      lista = this.tarefas.filter(t => !t.concluida);
    }
    // Se a aba for 'lixeira', você precisaria de um array separado
    // Mas como não adicionamos lógica de exclusão suave, 'todas' funciona como padrão


    // 2. FILTRAR POR TERMO DE PESQUISA (Nome/Descrição)
    if (this.termoPesquisa.trim()) {
      const termo = this.termoPesquisa.toLowerCase().trim();
      lista = lista.filter(t =>
        t.titulo.toLowerCase().includes(termo) ||
        t.descricao.toLowerCase().includes(termo)
      );
    }

    // 3. FILTRAR POR DATA ESPECÍFICA 
    if (this.filtroData) {
      // .utc() garante que o Moment não subtraia horas por causa do fuso local
      const dataFiltroFormatada = moment.utc(this.filtroData).format('DD/MM/YYYY');

      lista = lista.filter(t => {
        // Garantimos que a data da tarefa também seja formatada da mesma forma para comparar
        const dataTarefaFormatada = moment.utc(t.data).format('DD/MM/YYYY');

        return dataTarefaFormatada === dataFiltroFormatada;
      });
    }

    // 4. FILTRAR POR PRIORIDADE
    if (this.filtroPrioridade) {
      lista = lista.filter(t => t.prioridade === this.filtroPrioridade);
    }

    // 5. FILTRAR POR CATEGORIA
    if (this.filtroCategoria) {
      lista = lista.filter(t => {
        // Trata se a categoria está como objeto ou string
        const nomeCategoriaTarefa = typeof t.categoria === 'object' && t.categoria !== null ? t.categoria.nome : t.categoria;
        return nomeCategoriaTarefa === this.filtroCategoria;
      });
    }

    // 6. Ordenação Padrão: Por data mais antiga
    return lista.sort((a, b) => {
      const dataA = a.data ? moment(a.data, 'DD/MM/YYYY').toDate().getTime() : Infinity;
      const dataB = b.data ? moment(b.data, 'DD/MM/YYYY').toDate().getTime() : Infinity;
      return dataA - dataB;
    });
  }

  alternarVisibilidadeSenha(campo: string) {
    switch (campo) {
      case 'login':
        this.mostrarSenhaLogin = !this.mostrarSenhaLogin;
        break;
      case 'cadastro':
        this.mostrarSenhaCadastro = !this.mostrarSenhaCadastro;
        break;
      case 'alterar':
        this.mostrarSenhaAlterar = !this.mostrarSenhaAlterar;
        break;
      case 'confirmarAlterar':
        this.mostrarSenhaConfirmarAlterar = !this.mostrarSenhaConfirmarAlterar;
        break;
      case 'confirmacao':
        this.mostrarSenhaConfirmacao = !this.mostrarSenhaConfirmacao;
        break;
      case 'exclusao':
        this.mostrarSenhaExclusao = !this.mostrarSenhaExclusao;
        break;
      default:
        console.error("Campo de senha desconhecido:", campo);
    }
    this.cdr.detectChanges();
  }
}
