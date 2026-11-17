import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { PublicLayout } from './layouts/PublicLayout'
import { RequireRole } from './routes/RequireRole'
import AlunoDashboard from './pages/aluno/AlunoDashboard'
import AlunoBancaPage from './pages/aluno/BancaPage'
import EtapasPage from './pages/aluno/EtapasPage'
import CoordenacaoDashboard from './pages/coordenacao/CoordenacaoDashboard'
import CoordInscricoesPage from './pages/coordenacao/InscricoesPage'
import OrientadoresPage from './pages/coordenacao/OrientadoresPage'
import OrientadorDashboard from './pages/orientador/OrientadorDashboard'
import BancasPublicasPage from './pages/public/BancasPublicasPage'
import CalendarioPage from './pages/public/CalendarioPage'
import MinhasSolicitacoesPage from './pages/aluno/MinhasSolicitacoesPage'
import HistoricoPage from './pages/aluno/HistoricoPage'
import InscricaoPage from './pages/aluno/InscricaoPage'
import SolicitarOrientacaoPage from './pages/aluno/SolicitarOrientacaoPage'
import InscricoesRecebidasPage from './pages/orientador/InscricoesPage'
import PerfilPublicoPage from './pages/orientador/PerfilPublicoPage'
import SolicitacoesRecebidasPage from './pages/orientador/SolicitacoesRecebidasPage'
import BuscaOrientadoresPage from './pages/public/OrientadoresPage'
import ProfessorPerfilPage from './pages/public/ProfessorPerfilPage'
import SolicitacaoDetailPage from './pages/shared/SolicitacaoDetailPage'
import HomePage from './pages/public/HomePage'
import LoginPage from './pages/public/LoginPage'
import BancasPage from './pages/shared/BancasPage'
import DocumentsPage from './pages/shared/DocumentsPage'
import DocumentoPage from './pages/shared/DocumentoPage'
import SchedulePage from './pages/shared/SchedulePage'
import TccDetailPage from './pages/shared/TccDetailPage'
import TccListPage from './pages/shared/TccListPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AuthProvider>
        <Routes>
          {/* Área pública */}
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="bancas" element={<BancasPublicasPage />} />
            <Route path="orientadores" element={<BuscaOrientadoresPage />} />
            <Route path="orientadores/:id" element={<ProfessorPerfilPage />} />
            <Route path="calendario" element={<CalendarioPage />} />
            <Route path="entrar" element={<LoginPage />} />
          </Route>

          {/* Área logada: mesmo shell, navegação e páginas por perfil */}
          <Route path="aluno" element={<RequireRole role="aluno" />}>
            <Route index element={<AlunoDashboard />} />
            <Route path="inscricao" element={<InscricaoPage />} />
            <Route path="solicitar/:professorId" element={<SolicitarOrientacaoPage />} />
            <Route path="solicitacoes" element={<MinhasSolicitacoesPage />} />
            <Route path="solicitacoes/:id" element={<SolicitacaoDetailPage />} />
            <Route path="etapas" element={<EtapasPage />} />
            <Route path="cronograma" element={<SchedulePage />} />
            <Route path="documentos" element={<DocumentsPage />} />
            <Route path="documentos/:id" element={<DocumentoPage />} />
            <Route path="historico" element={<HistoricoPage />} />
            {/* o antigo "Feedbacks" virou parte de Documentos: links antigos continuam funcionando */}
            <Route path="feedbacks" element={<Navigate to="/aluno/documentos" replace />} />
            <Route path="banca" element={<AlunoBancaPage />} />
          </Route>

          <Route path="orientador" element={<RequireRole role="orientador" />}>
            <Route index element={<OrientadorDashboard />} />
            <Route path="orientandos" element={<TccListPage />} />
            <Route path="orientandos/:id" element={<TccDetailPage />} />
            <Route path="solicitacoes" element={<SolicitacoesRecebidasPage />} />
            <Route path="solicitacoes/:id" element={<SolicitacaoDetailPage />} />
            <Route path="inscricoes" element={<InscricoesRecebidasPage />} />
            <Route path="perfil" element={<PerfilPublicoPage />} />
            <Route path="cronogramas" element={<SchedulePage />} />
            <Route path="entregas" element={<DocumentsPage />} />
            <Route path="documentos/:id" element={<DocumentoPage />} />
            <Route path="bancas" element={<BancasPage />} />
          </Route>

          <Route path="coordenacao" element={<RequireRole role="coordenacao" />}>
            <Route index element={<CoordenacaoDashboard />} />
            <Route path="tccs" element={<TccListPage />} />
            <Route path="tccs/:id" element={<TccDetailPage />} />
            <Route path="inscricoes" element={<CoordInscricoesPage />} />
            <Route path="orientadores" element={<OrientadoresPage />} />
            <Route path="bancas" element={<BancasPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
