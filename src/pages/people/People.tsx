import { TextWithMath } from '../../components/TextWithMath';
import { siteContent } from '../../data/siteContent';
import { PersonCard } from './PersonCard';

function peopleInGroup(group: string) {
  return siteContent.peoplePage.people.filter((person) => person.group === group);
}

export function People() {
  const { join, peoplePage } = siteContent;
  const principalInvestigators = peopleInGroup('Principal Investigator');
  const graduateStudents = peopleInGroup('Graduate Students');
  const undergraduateStudents = peopleInGroup('Undergraduate Students');
  const labAiAgents = peopleInGroup('Lab AI Agents');

  return (
    <>
      <section className="section people-sections">
        <div className="team-section team-section-featured">
          <div className="section-heading">
            <p className="eyebrow">
              <TextWithMath value={peoplePage.sections.principalInvestigatorEyebrow} />
            </p>
            <h2>
              <TextWithMath value={peoplePage.sections.principalInvestigatorTitle} />
            </h2>
          </div>
          <div className="people-list people-list-featured">
            {principalInvestigators.map((person) => (
              <PersonCard key={`person-${person.name}`} person={person} featured />
            ))}
          </div>
        </div>

        <div className="team-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                <TextWithMath value={peoplePage.sections.graduateStudentsEyebrow} />
              </p>
              <h2>
                <TextWithMath value={peoplePage.sections.graduateStudentsTitle} />
              </h2>
            </div>
          </div>
          <div className="people-list team-grid">
            {graduateStudents.map((person) => (
              <PersonCard key={`person-${person.name}`} person={person} />
            ))}
          </div>
        </div>

        <div className="team-section">
          <div className="section-heading">
            <div>
              <h2>
                <TextWithMath value={peoplePage.sections.undergraduateStudentsTitle} />
              </h2>
            </div>
          </div>
          <div className="people-list team-grid">
            {undergraduateStudents.map((person) => (
              <PersonCard key={`person-${person.name}`} person={person} />
            ))}
          </div>
        </div>

        <div className="team-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                <TextWithMath value={peoplePage.sections.labAiAgentsEyebrow} />
              </p>
              <h2>
                <TextWithMath value={peoplePage.sections.labAiAgentsTitle} />
              </h2>
            </div>
          </div>
          <div className="people-list team-grid">
            {labAiAgents.map((person) => (
              <PersonCard key={`person-${person.name}`} person={person} />
            ))}
          </div>
        </div>
      </section>

      <section className="section muted join-summary">
        <div className="section-heading">
          <div>
            <h2>
              <TextWithMath value={peoplePage.joinSummary.title} />
            </h2>
            <p>
              <TextWithMath value={peoplePage.joinSummary.body} />
            </p>
          </div>
        </div>
        <div className="join-opportunity-grid">
          {join.groups.map((group, index) => (
            <article className="join-opportunity-card floating-tile" key={`join-opportunity-${index}`}>
              <h3>
                <TextWithMath value={group.title} />
              </h3>
              <p>
                <TextWithMath value={group.summary} />
                {group.link ? (
                  <>
                    {' '}
                    <a href={group.link.href} target="_blank" rel="noreferrer">
                      <TextWithMath value={group.link.label} />
                    </a>
                  </>
                ) : null}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
