update public.offers
set preview_image_url = '/offers/' || slug || '.png'
where preview_image_url is null
  and slug in ('membership', 'lander', 'debit-card', 'synteraxcard', 'xflow-partner');
