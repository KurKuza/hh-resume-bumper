import config from 'config';
import { createHeadhunter } from './headhunter.js';

const initAccount = async (name, acc) => {
  const hh = createHeadhunter({ token: acc.token, settings: acc });

  const shouldProcessBumping = !!acc?.resumeBumper?.enabled;
  const shouldBoostActivity = !!acc?.activityBoost?.enabled;

  if (shouldProcessBumping) {
    const resumeHashes = await hh.getResumeHashes();
    console.log(`[${name}] Got ${resumeHashes.length} resumes.`);

    setInterval(async () => {
      try {
        await hh.processBumping(resumeHashes);
      } catch (e) {
        console.log(`[${name}] bumping error:`, e?.message || e);
      }
    }, +acc.resumeBumper.checkInterval);
  }

  if (shouldBoostActivity) {
    let lastVacancyId;

    setInterval(async () => {
      try {
        const activityScore = await hh.getActivityScore();
        if (activityScore < 100) {
          console.log(`[${name}] Current activity score is ${activityScore}.`);
          if (!lastVacancyId) {
            lastVacancyId = await hh.getFirstVacancyId();
          } else {
            lastVacancyId++;
          }
          if (lastVacancyId) {
            await hh.viewVacancy(lastVacancyId);
          }
        }
      } catch (e) {
        console.log(`[${name}] activityBoost error:`, e?.message || e);
      }
    }, +acc.activityBoost.checkInterval);
  }
};

const init = async () => {
  const accounts = config.get('accounts');
  await Promise.all(
    Object.entries(accounts).map(([name, acc]) => initAccount(name, acc))
  );
};

init();
