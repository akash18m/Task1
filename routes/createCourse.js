var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var DB = require('../models/course.js');


router.get('/',function(req,res,next)
{
	DB.course.find(function (err, data) 
	{
    	if (err) return next(err);
    	res.json(data);
  	});
});

router.get('/sections',function(req,res,next)
{
	DB.section.find(function (err, data) 
	{
    	if (err) return next(err);
    	res.json(data);
  	});
});

router.get('/lessons',function(req,res,next)
{
	DB.lesson.find(function (err, data) 
	{
    	if (err) return next(err);
    	res.json(data);
  	});
});

let update_s_duration = (arr) => {
    return new Promise(
        (resolve) => {
        	s_duration = arr[0];
        	section_id = arr[1];
        	DB.section.findByIdAndUpdate(section_id,{$inc: {duration : s_duration}},function (err, data) 
			{
				console.log("s_dur updated")
				resolve([s_duration]);
    		});
    		
        }
    );
};

let update_c_duration = (arr) => {
    return new Promise(
        (resolve) => {
        	c_duration = arr[0];
        	course_id = arr[1];
        	DB.course.findByIdAndUpdate(course_id,{$inc: {duration : c_duration}},function (err, data) 
			{
	    		//if (err) return next(err);
	    		console.log("c_dur updated "+c_duration);
	    	});
    		
        }
    );
};

var count=[]; 
var count1;

let create_section = (sections,course_ID,i) => {
    return new Promise(
        (resolve) => {
        	var s_duration = 0;
			var sname = sections[i].name;
			var s_obj = {
				name : sname,
				position : i,
				duration : 0,
				course_id : course_ID,
			}
			var section_id;
			DB.section.create(s_obj,function (err, data_s) 
			{
				if (err) return next(err);
				section_id = data_s._id;
				var lesson = sections[i].lessons;
				add_lessons(lesson,section_id,i)
				.then(function(arr){
					resolve(arr);
				})
				.catch(err => {
	    			console.log(err)
				});;
			});
			
        }
    );
};

let add_sections = (sections,course_id) => {
    return new Promise(
        (resolve) => {
        	var c_duration=0;
        	count1=0;
            for(i in sections)
			{
				var flag = false;
				create_section(sections,course_id,i)
				//ss.then(update_s_duration)
				.then(function(arr){
					c_duration += arr[0];
					console.log("c_dur "+c_duration + "flag" + flag);
					count1++;
					if(count1 == sections.length){
		        		flag = true;
		        	}
					if(flag)
						update_c_duration([c_duration,course_id]);
				})
				.catch(err => {
	    			console.log(err)
				});
				//c_duration += s_duration;
			}
			
        }
    );
};

let create_lesson = (lesson,section_ID,j,i) => {
    return new Promise(
        (resolve) => {
            var flag=false;
            console.log(count)
            var l_obj = {
                name : lesson[j].name,
                position : j,
                duration : lesson[j].duration,
                section_id : section_ID,
            };
            DB.lesson.create(l_obj,function(err , data_l)
            {
                if(err) return next(err);
                count[i]++;
	            if(count[i] == lesson.length)
	            {
	                flag=true;
	            }
                resolve([data_l.duration,flag]);
            });
        }
    );
};

let add_lessons = (lesson,section_ID,i) => {
    return new Promise(
        (resolve) => {
        	var j;
        	count[i]=0;
			var s_duration=0;
            for(j in lesson)
			{
				create_lesson(lesson,section_ID,j,i).
                then(function(arr)
                {
                    s_duration+=arr[0];
                    console.log(arr[0]);
                    if(arr[1])
                    {
                    	console.log("added")
                        update_s_duration([s_duration,section_ID]).
                        then(function(arr){
                        	resolve([arr[0]]);
                        });
                        ;
                    }
                })
                .catch(err => {
	    			console.log(err)
				});;
				//c_duration += s_duration;
			}
			
        }
    );
};

router.post('/',function(req,res,next)
{
	console.log("hello");
	var cname = req.body.name;
	var sections = req.body.sections;
	var c_obj = {
		name : cname,
	    position : 1,
		duration : 0,
	}
	var course_id;
	DB.course.create(c_obj,function (err, data) 
	{
    	if (err) return next(err);
    	course_id = data._id;
    	add_sections(sections,course_id)
    	res.json(null);
  	});
});

router.post('/addSection',function(req,res,next)
{
	console.log("hello");
	var sections = req.body.sections;
	var course_id = req.body.course_id;
	
	add_sections(sections,course_id)
	res.json(null);
});


router.post('/addLesson',function(req,res,next)
{
	console.log("hello");
	var lessons = req.body.lessons;
	var section_id = req.body.section_id;
	var course_id;
	add_lessons(lessons,section_id,0)
	.then(function(arr){
		DB.section.findById(section_id,function(err,data){
			course_id = data.course_id;
			update_c_duration([arr[0] , course_id])
		})
		.catch(err => {
			console.log(err)
		});;
		res.json(null);
	})
	.catch(err => {
		console.log(err)
	});;

});

router.delete('/delete/:course_id',function(req,res,next)
{
	console.log("hello");
	var course_ID = req.params.course_id;
	DB.section.find({course_id : course_ID},function(err,data){
		for(i in data){
			var section_ID = data[i]._id;
			DB.lesson.remove({section_id : section_ID},function(err,data){

			})
			DB.section.remove({_id : section_ID},function(err,data){

			})
		}
	})
	.then(function(){
		DB.course.remove({_id : course_ID},function(err,data){
		
		})
		res.json(null);
	});
});

router.delete('/deleteSection/:section_id',function(req,res,next)
{
	console.log("hello");
	var section_ID = req.params.section_id;
	var s_duration = 0;
	DB.lesson.find({section_id : section_ID},function(err,data){
		console.log(data);
		for(i in data){
			s_duration += data[i].duration;
			DB.lesson.remove({_id : data[i]._id},function(err,data){

			})
		}
	})
	.then(function(){
		var course_ID;
		DB.section.find({_id : section_ID},function(err,data){
			course_ID = data[0].course_id;
			DB.section.remove({_id : data[0]._id},function(err,data){
				console.log(course_ID);
				update_c_duration([-s_duration , course_ID])
				res.json(null);
			})
		})
		
	});
});

router.delete('/deleteLesson/:lesson_id',function(req,res,next)
{
	console.log("hello");
	var lesson_ID = req.params.lesson_id;
	var section_ID;
	var duration = 0;
	DB.lesson.find({_id : lesson_ID},function(err,data){
		console.log(data);
		duration = data[0].duration;
		section_ID = data[0].section_id;
		DB.lesson.remove({_id : data[0]._id},function(err,data){
			
		})
	})
	.then(function(){
		var course_ID;
		DB.section.find({_id : section_ID},function(err,data){
			course_ID = data[0].course_id;
			update_s_duration([-duration , section_ID])
			update_c_duration([-duration , course_ID])
			res.json(null);
		})
	});
});

module.exports = router;
