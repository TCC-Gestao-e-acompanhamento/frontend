import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { Card, Icon, PageHeader, type IconName } from "../../design-system";
import { homePath, ROLE_LABEL } from "../../routes/navigation";
import type { Role } from "../../types";

const PERFIS: Array<{
  id: string;
  role: Role;
  descricao: string;
  icon: IconName;
}> = [
  {
    id: "a1",
    role: "aluno",
    descricao: "Acompanha o próprio TCC, prazos, entregas e feedbacks.",
    icon: "steps",
  },
  {
    id: "o1",
    role: "orientador",
    descricao: "Acompanha orientandos e registra feedbacks.",
    icon: "users",
  },
  {
    id: "c1",
    role: "coordenacao",
    descricao: "Visão institucional de TCCs, prazos e bancas.",
    icon: "flag",
  },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  // Preserva o destino (ex.: formulário do professor escolhido) após o login.
  const destino = (role: Role) =>
    from?.startsWith(`/${role}`) ? from : homePath(role);
  if (user) return <Navigate to={destino(user.role)} replace />;

  const aoSolicitar = from?.startsWith("/aluno/solicitar/");

  const entrar = (id: string) => {
    const u = login(id);
    if (!u) return;
    navigate(destino(u.role), { replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Entrar"
        description="Escolha o perfil que deseja acessar."
      />
      {aoSolicitar && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-700"
        >
          Para solicitar orientação, entre como aluno. Depois do login você
          volta ao formulário do professor escolhido.
        </p>
      )}
      <ul className="grid grid-cols-1 gap-3">
        {PERFIS.map((p) => (
          <li key={p.id}>
            <Card className="transition-colors hover:border-brand-500">
              <button
                type="button"
                onClick={() => entrar(p.id)}
                className="flex min-h-11 w-full items-center gap-4 rounded-card p-4 text-left"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon name={p.icon} />
                </span>
                <span className="flex-1">
                  <span className="block font-semibold">
                    Entrar como {ROLE_LABEL[p.role]}
                  </span>
                  <span className="block text-sm text-ink-muted">
                    {p.descricao}
                  </span>
                </span>
                <Icon name="arrow" className="text-ink-muted" />
              </button>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
