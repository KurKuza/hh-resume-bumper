import axios from 'axios';
import * as cheerio from 'cheerio';
import { getHeaders } from './headers.js';
import { sleep } from './helpers.js';
import FormData from 'form-data';

export const createHeadhunter = ({ token, settings }) => {
  let xsrf;

  const setXsrf = (headers) => {
    const cookies = headers?.['set-cookie'] || [];
    const xsrfCookie = cookies.find((cookie) => cookie.includes('_xsrf='));
    xsrf = xsrfCookie ? xsrfCookie.split('_xsrf=')[1].split(';')[0] : undefined;
  };

  const getResumeHashes = async () => {
    try {
      const hashes = [];
      const { data } = await axios.get('https://hh.ru/applicant/resumes', {
        headers: getHeaders(token),
      });
      const $ = cheerio.load(data);
      $('a[data-qa^="resume-card-link"]').each(function () {
        const hash = $(this).attr('href')?.split('/resume/')[1]?.split('?')[0];
        if (hash) hashes.push(hash);
      });
      return hashes;
    } catch (e) {
      if (e?.response?.status === 403) {
        console.log(
          `Failed to get resume hashes because of bad token. ${e.response.statusText}`
        );
        return [];
      }
      console.log('Failed to get resume hashes.');
      console.log(e);
      return [];
    }
  };

  const isResumeReadyToBeBumped = async (hash) => {
    try {
      const { data, headers } = await axios.get(
        'https://hh.ru/applicant/resumes',
        { headers: getHeaders(token) }
      );
      setXsrf(headers);

      const $ = cheerio.load(data);
      const selectors = [
        $(`[href*=${hash}][data-qa*="resume-card-link"]`)
          .eq(0)
          .parent()
          .parent()
          .find('span[data-qa*="resume-update-button-text"]')
          .eq(0)
          .text()
          .trim()
          .includes('Поднять'),
        $(`[href*=${hash}][data-qa*="resume-card-link"]`)
          .eq(0)
          .parent()
          .parent()
          .find('button[data-qa*="resume-update-button"]')
          .eq(0)
          .text()
          .trim()
          .includes('Поднять'),
      ];
      return selectors.some(Boolean);
    } catch (e) {
      console.log('Failed to check resume bump state.');
      console.log(e);
      return false;
    }
  };

  const processBumping = async (hashes) => {
    try {
      for (const hash of hashes) {
        const shouldBump = await isResumeReadyToBeBumped(hash);
        if (shouldBump) {
          const formData = new FormData();
          formData.append('resume', hash);
          formData.append('undirectable', 'true');
          await axios.post('https://hh.ru/applicant/resumes/touch', formData, {
            headers: getHeaders(token, xsrf),
          });
          console.log('Bumped!');
          await sleep(settings.resumeBumper.bumpInterval);
        }
      }
    } catch (e) {
      console.log('Failed to bump resume.');
      console.log(e);
    }
  };

  const getActivityScore = async () => {
    try {
      const { data } = await axios.get('https://hh.ru/', {
        headers: getHeaders(token),
      });
      const $ = cheerio.load(data);
      return +$(`[data-qa="activity-score"]`).eq(0).text().split('%')[0];
    } catch (e) {
      console.log('Failed to get activity score.');
      console.log(e);
      return 100;
    }
  };

  const getFirstVacancyId = async () => {
    try {
      const { data } = await axios.get('https://hh.ru/', {
        headers: getHeaders(token),
      });
      const $ = cheerio.load(data);
      return $('[data-qa*="vacancy-serp__vacancy"]')
        .eq(0)
        .find('[data-qa="serp-item__title"]')
        .attr('href')
        .split('/vacancy/')[1]
        .split('?')[0];
    } catch (e) {
      console.log('Failed to get first vacancy id.');
      console.log(e);
      return null;
    }
  };

  const viewVacancy = async (id) => {
    try {
      await axios.get(
        `https://hh.ru/vacancy/${id}?from=applicant_recommended&hhtmFrom=main`,
        { headers: getHeaders(token) }
      );
      console.log(`Viewed vacancy with id ${id}.`);
    } catch (e) {
      if (e?.response?.status === 404) {
        console.log(`Failed to view vacancy with id ${id}. It was deleted.`);
        return;
      }
      console.log(e);
    }
  };

  return {
    getResumeHashes,
    processBumping,
    getActivityScore,
    getFirstVacancyId,
    viewVacancy,
  };
};
